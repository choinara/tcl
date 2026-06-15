package com.peakmate.backend.application.email;

import com.peakmate.backend.domain.email.entity.EmailAttachment;
import com.peakmate.backend.domain.email.entity.EmailMessage;
import com.peakmate.backend.domain.email.repository.EmailAttachmentRepository;
import com.peakmate.backend.domain.email.repository.EmailMessageRepository;
import jakarta.mail.Address;
import jakarta.mail.MessagingException;
import jakarta.mail.Multipart;
import jakarta.mail.Part;
import jakarta.mail.Session;
import jakarta.mail.internet.InternetAddress;
import jakarta.mail.internet.MimeMessage;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
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

    @Value("${app.email.import-path}")
    private String importPath;

    private static final long ACCOUNT_ID = 1L;
    private static final int RETENTION_DAYS = 7;

    public record ImportResult(int total, int imported, int skipped, int failed) {}

    public ImportResult importFromFolder() {
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
            log.info("이메일 임포트 시작: {} 건, 경로={}", total, importPath);

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

        log.info("이메일 임포트 완료: total={}, imported={}, skipped={}, failed={}", total, imported, skipped, failed);
        return new ImportResult(total, imported, skipped, failed);
    }

    @Transactional
    protected boolean importSingleFile(Path emlFile) throws Exception {
        Session session = Session.getDefaultInstance(new Properties());

        MimeMessage mimeMessage;
        try (FileInputStream fis = new FileInputStream(emlFile.toFile())) {
            mimeMessage = new MimeMessage(session, fis);
        }

        String messageId = extractMessageId(mimeMessage, emlFile);

        if (messageRepository.existsByGmailMessageIdAndAccountId(messageId, ACCOUNT_ID)) {
            return false;
        }

        String senderEmail = extractSenderEmail(mimeMessage);
        String senderName = extractSenderName(mimeMessage);
        String subject = decodeSubject(mimeMessage);
        String recipient = extractAddresses(mimeMessage.getRecipients(MimeMessage.RecipientType.TO));
        String cc = extractAddresses(mimeMessage.getRecipients(MimeMessage.RecipientType.CC));
        OffsetDateTime receivedAt = extractReceivedAt(mimeMessage);

        BodyContent body = extractBody(mimeMessage);
        Long sizeBytes = emlFile.toFile().length();
        OffsetDateTime retentionUntil = OffsetDateTime.now().plusDays(RETENTION_DAYS);

        EmailMessage entity = EmailMessage.create(
                messageId, null, ACCOUNT_ID,
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

    private String extractMessageId(MimeMessage msg, Path file) throws MessagingException {
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

    private String extractSenderEmail(MimeMessage msg) throws MessagingException {
        Address[] froms = msg.getFrom();
        if (froms == null || froms.length == 0) return null;
        if (froms[0] instanceof InternetAddress ia) return ia.getAddress();
        return froms[0].toString();
    }

    private String extractSenderName(MimeMessage msg) throws MessagingException {
        Address[] froms = msg.getFrom();
        if (froms == null || froms.length == 0) return null;
        if (froms[0] instanceof InternetAddress ia) {
            String personal = ia.getPersonal();
            return (personal != null && !personal.isBlank()) ? personal : ia.getAddress();
        }
        return froms[0].toString();
    }

    private String decodeSubject(MimeMessage msg) throws MessagingException {
        String subject = msg.getSubject();
        return subject != null ? subject : "(제목 없음)";
    }

    private String extractAddresses(Address[] addresses) {
        if (addresses == null || addresses.length == 0) return null;
        List<String> list = new ArrayList<>();
        for (Address addr : addresses) {
            if (addr instanceof InternetAddress ia) {
                list.add(ia.getAddress());
            } else {
                list.add(addr.toString());
            }
        }
        return String.join(", ", list);
    }

    private OffsetDateTime extractReceivedAt(MimeMessage msg) throws MessagingException {
        Date sentDate = msg.getSentDate();
        if (sentDate != null) {
            return sentDate.toInstant().atZone(ZoneId.systemDefault()).toOffsetDateTime();
        }
        return OffsetDateTime.now();
    }

    private record BodyContent(String text, String html, List<AttachmentInfo> attachments) {}
    private record AttachmentInfo(String fileName, String mimeType, long sizeBytes) {}

    private BodyContent extractBody(Part part) throws MessagingException, IOException {
        String text = null;
        String html = null;
        List<AttachmentInfo> attachments = new ArrayList<>();
        extractBodyRecursive(part, new StringBuilder(), new StringBuilder(), attachments);

        String rawText = extractTextRecursive(part);
        String rawHtml = extractHtmlRecursive(part);
        return new BodyContent(rawText, rawHtml, attachments);
    }

    private void extractBodyRecursive(Part part, StringBuilder textBuf, StringBuilder htmlBuf,
                                       List<AttachmentInfo> attachments) throws MessagingException, IOException {
        String disposition = part.getDisposition();
        if (Part.ATTACHMENT.equalsIgnoreCase(disposition) || Part.INLINE.equalsIgnoreCase(disposition)) {
            if (part.getFileName() != null) {
                attachments.add(new AttachmentInfo(
                        part.getFileName(),
                        part.getContentType().split(";")[0].trim(),
                        (long) part.getSize()
                ));
                return;
            }
        }
        if (part.isMimeType("multipart/*")) {
            Object content = part.getContent();
            if (!(content instanceof Multipart mp)) return;
            for (int i = 0; i < mp.getCount(); i++) {
                extractBodyRecursive(mp.getBodyPart(i), textBuf, htmlBuf, attachments);
            }
        }
    }

    private String extractTextRecursive(Part part) throws MessagingException, IOException {
        if (part.isMimeType("text/plain")) {
            return readPartContent(part);
        }
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
        if (part.isMimeType("text/html")) {
            return readPartContent(part);
        }
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

    /** getContent()가 String 또는 InputStream을 반환할 수 있어 양쪽 처리 */
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
}
