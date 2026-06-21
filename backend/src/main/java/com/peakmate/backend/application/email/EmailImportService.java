package com.peakmate.backend.application.email;

import com.peakmate.backend.domain.email.entity.EmailAttachment;
import com.peakmate.backend.domain.email.entity.EmailMessage;
import com.peakmate.backend.domain.email.repository.EmailAttachmentRepository;
import com.peakmate.backend.domain.email.repository.EmailMessageRepository;
import com.peakmate.backend.domain.log.service.SystemLogService;
import com.peakmate.backend.infra.config.ImapProperties;
import jakarta.mail.*;
import jakarta.mail.internet.InternetAddress;
import jakarta.mail.internet.MimeMessage;
import jakarta.mail.search.FlagTerm;
import jakarta.persistence.EntityManager;
import jakarta.persistence.PersistenceContext;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.io.FileInputStream;
import java.io.IOException;
import java.io.InputStream;
import java.nio.charset.StandardCharsets;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.security.MessageDigest;
import java.time.OffsetDateTime;
import java.time.ZoneId;
import java.util.ArrayList;
import java.util.Date;
import java.util.HexFormat;
import java.util.List;
import java.util.Properties;
import java.util.stream.Stream;

@Slf4j
@Service
@RequiredArgsConstructor
public class EmailImportService {

    private final EmailMessageRepository messageRepository;
    private final EmailAttachmentRepository attachmentRepository;
    private final ImapProperties imapProperties;
    private final SystemLogService systemLogService;

    @PersistenceContext
    private EntityManager entityManager;

    private static final int RETENTION_DAYS = 7;

    public record ImportResult(int total, int imported, int skipped, int failed) {}

    // ─────────────────────────────────────────────────────────────────────
    // IMAP 폴링 (B-6)
    // ─────────────────────────────────────────────────────────────────────

    @Scheduled(fixedDelayString = "${app.email.imap.poll-interval-ms:300000}")
    public void pollNewEmails() {
        List<ImapProperties.AccountConfig> accounts = resolveAccounts();
        if (accounts.isEmpty()) {
            log.warn("IMAP 계정 미설정 — 폴링 건너뜀 (app.email.imap.accounts 또는 system_setting 확인 필요)");
            return;
        }

        for (ImapProperties.AccountConfig account : accounts) {
            if (!account.isConfigured()) {
                log.warn("IMAP 계정 설정 불완전 — 건너뜀: host={}", account.getHost());
                continue;
            }
            pollAccount(account);
        }
    }

    private void pollAccount(ImapProperties.AccountConfig account) {
        String accountLabel = account.getUsername() + "@" + account.getHost();
        log.info("IMAP 폴링 시작: account={}", accountLabel);

        Store store = null;
        Folder folder = null;
        try {
            store = connectStore(account);
            folder = store.getFolder(account.getFolder());
            folder.open(Folder.READ_WRITE);

            Message[] unseen = folder.search(new FlagTerm(new Flags(Flags.Flag.SEEN), false));
            log.info("IMAP 미읽음 메일: account={}, count={}", accountLabel, unseen.length);

            int imported = 0, skipped = 0, failed = 0;
            for (Message message : unseen) {
                try {
                    boolean wasImported = importSingleMessage(message, account);
                    if (wasImported) {
                        message.setFlag(Flags.Flag.SEEN, true);
                        imported++;
                    } else {
                        skipped++;
                    }
                } catch (Exception e) {
                    failed++;
                    log.warn("IMAP 메일 처리 실패 — 건너뜀: account={}, error={}", accountLabel, e.getMessage());
                }
            }
            log.info("IMAP 폴링 완료: account={}, imported={}, skipped={}, failed={}",
                    accountLabel, imported, skipped, failed);

        } catch (Exception e) {
            log.error("IMAP 폴링 오류: account={}, error={}", accountLabel, e.getMessage(), e);
            try {
                systemLogService.log("SCHEDULER", null, "SYSTEM", null,
                        "IMAP_POLL_FAIL",
                        "account=" + accountLabel + ", error=" + e.getMessage());
            } catch (Exception logEx) {
                log.warn("SystemLog 기록 실패: {}", logEx.getMessage());
            }
        } finally {
            closeQuietly(folder, store);
        }
    }

    @Transactional
    protected boolean importSingleMessage(Message message, ImapProperties.AccountConfig account) throws Exception {
        String messageId = extractMessageId(message);
        long accountId = deriveAccountId(account);

        if (messageRepository.existsByGmailMessageIdAndAccountId(messageId, accountId)) {
            return false;
        }

        String senderEmail = extractSenderEmail(message);
        String senderName  = extractSenderName(message);
        String subject     = message.getSubject() != null ? message.getSubject() : "(제목 없음)";
        String recipient   = extractAddresses(message.getRecipients(Message.RecipientType.TO));
        String cc          = extractAddresses(message.getRecipients(Message.RecipientType.CC));
        OffsetDateTime receivedAt = extractReceivedAt(message);

        BodyContent body = extractBody(message);
        long sizeBytes = message.getSize() > 0 ? message.getSize() : 0L;
        OffsetDateTime retentionUntil = OffsetDateTime.now().plusDays(RETENTION_DAYS);

        EmailMessage entity = EmailMessage.create(
                messageId, null, accountId,
                subject, senderEmail, senderName,
                recipient, cc, receivedAt,
                null, body.text(), body.html(),
                sizeBytes, retentionUntil
        );
        EmailMessage saved = messageRepository.save(entity);

        for (AttachmentInfo att : body.attachments()) {
            EmailAttachment attachment = EmailAttachment.create(
                    saved.getId(), att.fileName(), att.mimeType(),
                    att.sizeBytes(), null, att.fileName()
            );
            attachmentRepository.save(attachment);
        }
        return true;
    }

    // ─────────────────────────────────────────────────────────────────────
    // 계정 목록 해석: DB(system_setting) → yml 폴백
    // ─────────────────────────────────────────────────────────────────────

    @SuppressWarnings("unchecked")
    private List<ImapProperties.AccountConfig> resolveAccounts() {
        // yml에 설정된 계정 목록을 기본으로 사용
        // DB(system_setting)에 'app.email.imap.accounts' 키 있으면 무시하고 yml 우선 (단순 폴백 구조)
        List<ImapProperties.AccountConfig> ymlAccounts = imapProperties.getAccounts();
        if (!ymlAccounts.isEmpty()) {
            return ymlAccounts;
        }

        // yml 계정이 없으면 DB에서 계정 수 힌트만 확인 (실제 운영 시 yml 또는 별도 테이블로 관리)
        try {
            List<String> results = entityManager.createNativeQuery(
                    "SELECT setting_value FROM system_setting " +
                    "WHERE setting_key = 'app.email.imap.accounts'")
                    .getResultList();
            if (!results.isEmpty() && results.get(0) != null && !results.get(0).isBlank()) {
                log.info("system_setting에서 IMAP 계정 설정 발견 (현재는 yml 폴백으로만 운영)");
            }
        } catch (Exception e) {
            log.debug("system_setting IMAP 계정 조회 실패, yml 폴백: {}", e.getMessage());
        }

        return List.of();
    }

    // ─────────────────────────────────────────────────────────────────────
    // IMAP 연결
    // ─────────────────────────────────────────────────────────────────────

    private Store connectStore(ImapProperties.AccountConfig account) throws MessagingException {
        Properties props = new Properties();
        String protocol;
        if (account.isSsl()) {
            protocol = "imaps";
            props.put("mail.imaps.host", account.getHost());
            props.put("mail.imaps.port", String.valueOf(account.getPort()));
            props.put("mail.imaps.ssl.enable", "true");
        } else {
            protocol = "imap";
            props.put("mail.imap.host", account.getHost());
            props.put("mail.imap.port", String.valueOf(account.getPort()));
        }
        Session session = Session.getInstance(props);
        Store store = session.getStore(protocol);
        store.connect(account.getHost(), account.getPort(), account.getUsername(), account.getPassword());
        return store;
    }

    private void closeQuietly(Folder folder, Store store) {
        try { if (folder != null && folder.isOpen()) folder.close(false); } catch (Exception ignored) {}
        try { if (store != null && store.isConnected()) store.close(); } catch (Exception ignored) {}
    }

    // ─────────────────────────────────────────────────────────────────────
    // 파싱 유틸 (Message-ID, 헤더, 본문)
    // ─────────────────────────────────────────────────────────────────────

    private String extractMessageId(Message message) throws MessagingException {
        String[] ids = message.getHeader("Message-ID");
        if (ids != null && ids.length > 0 && ids[0] != null && !ids[0].isBlank()) {
            return ids[0].trim();
        }
        // Message-ID 없으면 Subject + 수신일 기반 해시
        try {
            String seed = message.getSubject() + extractReceivedAt(message);
            byte[] hash = MessageDigest.getInstance("SHA-256")
                    .digest(seed.getBytes(StandardCharsets.UTF_8));
            return "imap:" + HexFormat.of().formatHex(hash).substring(0, 32);
        } catch (Exception e) {
            return "imap:" + System.currentTimeMillis();
        }
    }

    private String extractSenderEmail(Message msg) throws MessagingException {
        Address[] froms = msg.getFrom();
        if (froms == null || froms.length == 0) return null;
        if (froms[0] instanceof InternetAddress ia) return ia.getAddress();
        return froms[0].toString();
    }

    private String extractSenderName(Message msg) throws MessagingException {
        Address[] froms = msg.getFrom();
        if (froms == null || froms.length == 0) return null;
        if (froms[0] instanceof InternetAddress ia) {
            String personal = ia.getPersonal();
            return (personal != null && !personal.isBlank()) ? personal : ia.getAddress();
        }
        return froms[0].toString();
    }

    private String extractAddresses(Address[] addresses) {
        if (addresses == null || addresses.length == 0) return null;
        List<String> list = new ArrayList<>();
        for (Address addr : addresses) {
            if (addr instanceof InternetAddress ia) list.add(ia.getAddress());
            else list.add(addr.toString());
        }
        return String.join(", ", list);
    }

    private OffsetDateTime extractReceivedAt(Message msg) throws MessagingException {
        Date sentDate = msg.getSentDate();
        if (sentDate != null) {
            return sentDate.toInstant().atZone(ZoneId.systemDefault()).toOffsetDateTime();
        }
        return OffsetDateTime.now();
    }

    /** account.username 기반 결정론적 accountId. 실 운영 시 imap_accounts 테이블 PK로 대체. */
    private long deriveAccountId(ImapProperties.AccountConfig account) {
        return Math.abs((long) account.getUsername().hashCode()) % 10000 + 1;
    }

    // ─────────────────────────────────────────────────────────────────────
    // 본문 파싱
    // ─────────────────────────────────────────────────────────────────────

    private record BodyContent(String text, String html, List<AttachmentInfo> attachments) {}
    private record AttachmentInfo(String fileName, String mimeType, long sizeBytes) {}

    private BodyContent extractBody(Part part) throws MessagingException, IOException {
        List<AttachmentInfo> attachments = new ArrayList<>();
        extractAttachmentsRecursive(part, attachments);
        String rawText = extractTextRecursive(part);
        String rawHtml = extractHtmlRecursive(part);
        return new BodyContent(rawText, rawHtml, attachments);
    }

    private void extractAttachmentsRecursive(Part part, List<AttachmentInfo> attachments)
            throws MessagingException, IOException {
        String disposition = part.getDisposition();
        if ((Part.ATTACHMENT.equalsIgnoreCase(disposition) || Part.INLINE.equalsIgnoreCase(disposition))
                && part.getFileName() != null) {
            attachments.add(new AttachmentInfo(
                    part.getFileName(),
                    part.getContentType().split(";")[0].trim(),
                    (long) part.getSize()
            ));
            return;
        }
        if (part.isMimeType("multipart/*")) {
            Object content = part.getContent();
            if (!(content instanceof Multipart mp)) return;
            for (int i = 0; i < mp.getCount(); i++) {
                extractAttachmentsRecursive(mp.getBodyPart(i), attachments);
            }
        }
    }

    private String extractTextRecursive(Part part) throws MessagingException, IOException {
        if (part.isMimeType("text/plain")) return readPartContent(part);
        if (part.isMimeType("multipart/*")) {
            Object content = part.getContent();
            if (!(content instanceof Multipart mp)) return null;
            for (int i = 0; i < mp.getCount(); i++) {
                String result = extractTextRecursive(mp.getBodyPart(i));
                if (result != null) return result;
            }
        }
        return null;
    }

    private String extractHtmlRecursive(Part part) throws MessagingException, IOException {
        if (part.isMimeType("text/html")) return readPartContent(part);
        if (part.isMimeType("multipart/*")) {
            Object content = part.getContent();
            if (!(content instanceof Multipart mp)) return null;
            for (int i = 0; i < mp.getCount(); i++) {
                String result = extractHtmlRecursive(mp.getBodyPart(i));
                if (result != null) return result;
            }
        }
        return null;
    }

    private String readPartContent(Part part) throws MessagingException, IOException {
        Object content = part.getContent();
        if (content instanceof String s) return s;
        if (content instanceof InputStream is) {
            String charset = extractCharset(part.getContentType());
            return new String(is.readAllBytes(),
                    charset != null ? java.nio.charset.Charset.forName(charset) : StandardCharsets.UTF_8);
        }
        return content != null ? content.toString() : null;
    }

    private String extractCharset(String contentType) {
        if (contentType == null) return null;
        for (String token : contentType.split(";")) {
            String t = token.trim();
            if (t.toLowerCase().startsWith("charset=")) {
                return t.substring("charset=".length()).replace("\"", "").trim();
            }
        }
        return null;
    }

    // ─────────────────────────────────────────────────────────────────────
    // 레거시 — .eml 파일 기반 임포트 (TCL 운영에서는 미사용)
    // ─────────────────────────────────────────────────────────────────────

    @Deprecated
    public ImportResult importFromFolder(String importPath) {
        Path folder = Paths.get(importPath);
        if (!Files.exists(folder) || !Files.isDirectory(folder)) {
            throw new IllegalArgumentException("이메일 임포트 경로를 찾을 수 없습니다: " + importPath);
        }

        int total = 0, imported = 0, skipped = 0, failed = 0;

        try (Stream<Path> paths = Files.walk(folder)) {
            List<Path> emlFiles = paths
                    .filter(Files::isRegularFile)
                    .filter(p -> p.toString().toLowerCase().endsWith(".eml"))
                    .sorted()
                    .toList();

            total = emlFiles.size();
            log.info("eml 임포트 시작: {} 건, 경로={}", total, importPath);

            for (Path emlFile : emlFiles) {
                try {
                    boolean wasImported = importSingleFile(emlFile);
                    if (wasImported) imported++;
                    else skipped++;
                } catch (Exception e) {
                    failed++;
                    log.warn("eml 파싱 실패 — 건너뜀: file={}, error={}", emlFile.getFileName(), e.getMessage());
                }
            }
        } catch (IOException e) {
            throw new IllegalStateException("이메일 폴더 탐색 실패: " + e.getMessage(), e);
        }

        log.info("eml 임포트 완료: total={}, imported={}, skipped={}, failed={}", total, imported, skipped, failed);
        return new ImportResult(total, imported, skipped, failed);
    }

    @Deprecated
    @Transactional
    protected boolean importSingleFile(Path emlFile) throws Exception {
        Session session = Session.getDefaultInstance(new Properties());
        MimeMessage mimeMessage;
        try (FileInputStream fis = new FileInputStream(emlFile.toFile())) {
            mimeMessage = new MimeMessage(session, fis);
        }

        String messageId = extractMessageIdFromMime(mimeMessage, emlFile);
        if (messageRepository.existsByGmailMessageIdAndAccountId(messageId, 1L)) {
            return false;
        }

        String senderEmail = extractSenderEmailFromMime(mimeMessage);
        String senderName  = extractSenderNameFromMime(mimeMessage);
        String subject     = mimeMessage.getSubject() != null ? mimeMessage.getSubject() : "(제목 없음)";
        String recipient   = extractAddresses(mimeMessage.getRecipients(MimeMessage.RecipientType.TO));
        String cc          = extractAddresses(mimeMessage.getRecipients(MimeMessage.RecipientType.CC));
        OffsetDateTime receivedAt = extractReceivedAtFromMime(mimeMessage);

        BodyContent body = extractBody(mimeMessage);
        long sizeBytes = emlFile.toFile().length();
        OffsetDateTime retentionUntil = OffsetDateTime.now().plusDays(RETENTION_DAYS);

        EmailMessage entity = EmailMessage.create(
                messageId, null, 1L,
                subject, senderEmail, senderName,
                recipient, cc, receivedAt,
                null, body.text(), body.html(),
                sizeBytes, retentionUntil
        );
        EmailMessage saved = messageRepository.save(entity);

        for (AttachmentInfo att : body.attachments()) {
            EmailAttachment attachment = EmailAttachment.create(
                    saved.getId(), att.fileName(), att.mimeType(),
                    att.sizeBytes(), emlFile.toString(), att.fileName()
            );
            attachmentRepository.save(attachment);
        }
        return true;
    }

    private String extractMessageIdFromMime(MimeMessage msg, Path file) throws MessagingException {
        String[] ids = msg.getHeader("Message-ID");
        if (ids != null && ids.length > 0 && ids[0] != null && !ids[0].isBlank()) {
            return ids[0].trim();
        }
        try {
            byte[] hash = MessageDigest.getInstance("SHA-256")
                    .digest(file.toString().getBytes(StandardCharsets.UTF_8));
            return "file:" + HexFormat.of().formatHex(hash).substring(0, 32);
        } catch (Exception e) {
            return "file:" + file.getFileName().toString();
        }
    }

    private String extractSenderEmailFromMime(MimeMessage msg) throws MessagingException {
        Address[] froms = msg.getFrom();
        if (froms == null || froms.length == 0) return null;
        if (froms[0] instanceof InternetAddress ia) return ia.getAddress();
        return froms[0].toString();
    }

    private String extractSenderNameFromMime(MimeMessage msg) throws MessagingException {
        Address[] froms = msg.getFrom();
        if (froms == null || froms.length == 0) return null;
        if (froms[0] instanceof InternetAddress ia) {
            String personal = ia.getPersonal();
            return (personal != null && !personal.isBlank()) ? personal : ia.getAddress();
        }
        return froms[0].toString();
    }

    private OffsetDateTime extractReceivedAtFromMime(MimeMessage msg) throws MessagingException {
        Date sentDate = msg.getSentDate();
        if (sentDate != null) {
            return sentDate.toInstant().atZone(ZoneId.systemDefault()).toOffsetDateTime();
        }
        return OffsetDateTime.now();
    }
}
