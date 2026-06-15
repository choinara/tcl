package com.peakmate.backend.infra.mail;

import com.peakmate.backend.domain.system.service.SystemSettingService;
import com.peakmate.core.crypto.AES256Encryptor;
import jakarta.mail.MessagingException;
import jakarta.mail.internet.MimeMessage;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.core.io.FileSystemResource;
import org.springframework.mail.javamail.JavaMailSenderImpl;
import org.springframework.mail.javamail.MimeMessageHelper;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Service;
import org.thymeleaf.TemplateEngine;
import org.thymeleaf.context.Context;

import java.io.File;
import java.util.List;
import java.util.Map;
import java.util.Properties;

/**
 * 범용 메일 발송 서비스.
 * DB(system_setting)에서 메일 서버 설정을 읽어 동적으로 SMTP 연결합니다.
 * 시스템 설정 화면에서 변경한 값이 즉시 반영됩니다.
 */
@Service
@RequiredArgsConstructor
@Slf4j
public class MailService {

    private final TemplateEngine templateEngine;
    private final SystemSettingService settingService;
    private final MailRetryableSender mailRetryableSender;

    /**
     * HTML 템플릿 메일 발송 (비동기)
     */
    @Async
    public void send(String to, String subject, String templateName, Map<String, Object> variables) {
        if (!isEnabled()) {
            log.info("[메일 비활성] to={}, subject={}, template={}", to, subject, templateName);
            return;
        }
        try {
            Context context = new Context();
            context.setVariables(variables);
            String htmlContent = templateEngine.process("mail/" + templateName, context);
            sendHtml(to, subject, htmlContent, null);
            log.info("[메일 발송 성공] to={}, subject={}", to, subject);
        } catch (Exception e) {
            log.error("[메일 발송 실패] to={}, subject={}", to, subject, e);
        }
    }

    /**
     * 다수 수신자에게 HTML 템플릿 메일 발송 (비동기)
     */
    @Async
    public void sendToMultiple(List<String> toList, String subject, String templateName, Map<String, Object> variables) {
        for (String to : toList) {
            send(to, subject, templateName, variables);
        }
    }

    /**
     * 단순 텍스트 메일 발송 (비동기)
     */
    @Async
    public void sendSimple(String to, String subject, String textContent) {
        if (!isEnabled()) {
            log.info("[메일 비활성] to={}, subject={}", to, subject);
            return;
        }
        try {
            JavaMailSenderImpl sender = buildMailSender();
            MimeMessage message = sender.createMimeMessage();
            MimeMessageHelper helper = new MimeMessageHelper(message, false, "UTF-8");
            helper.setFrom(getFromAddress(), getFromName());
            helper.setTo(to);
            helper.setSubject(subject);
            helper.setText(textContent, false);
            mailRetryableSender.send(sender, message);
            log.info("[메일 발송 성공] to={}, subject={}", to, subject);
        } catch (Exception e) {
            log.error("[메일 발송 실패] to={}, subject={}", to, subject, e);
        }
    }

    /**
     * 첨부파일 포함 HTML 메일 발송 (비동기)
     */
    @Async
    public void sendWithAttachment(String to, String subject, String templateName,
                                   Map<String, Object> variables, List<File> attachments) {
        if (!isEnabled()) {
            log.info("[메일 비활성] to={}, subject={}", to, subject);
            return;
        }
        try {
            Context context = new Context();
            context.setVariables(variables);
            String htmlContent = templateEngine.process("mail/" + templateName, context);
            sendHtml(to, subject, htmlContent, attachments);
            log.info("[메일 발송 성공] to={}, subject={}, 첨부={}건", to, subject,
                    attachments != null ? attachments.size() : 0);
        } catch (Exception e) {
            log.error("[메일 발송 실패] to={}, subject={}", to, subject, e);
        }
    }

    /**
     * 메일 발송 가능 여부 (DB 설정 기준)
     */
    public boolean isEnabled() {
        return settingService.getBooleanValue("mail.enabled", false);
    }

    /**
     * 동기 방식 HTML 템플릿 메일 발송 (테스트용).
     * 발송 성공 시 true, 실패 시 false 반환. 에러 상세는 서버 로그에만 기록.
     */
    public boolean sendSync(String to, String subject, String templateName, Map<String, Object> variables) {
        try {
            Context context = new Context();
            context.setVariables(variables);
            String htmlContent = templateEngine.process("mail/" + templateName, context);
            sendHtml(to, subject, htmlContent, null);
            log.info("[메일 발송 성공] to={}, subject={}", to, subject);
            return true;
        } catch (Exception e) {
            log.error("[메일 발송 실패] to={}, subject={}", to, subject, e);
            return false;
        }
    }

    /**
     * 메일 서버 연결 테스트 (동기)
     */
    public boolean testConnection() {
        try {
            JavaMailSenderImpl sender = buildMailSender();
            sender.testConnection();
            return true;
        } catch (Exception e) {
            log.warn("[메일 서버 연결 실패]", e);
            return false;
        }
    }

    /**
     * 현재 DB에 저장된 메일 설정 조회
     */
    public Map<String, String> getSettings() {
        return Map.of(
                "enabled", settingService.getValue("mail.enabled", "false"),
                "host", settingService.getValue("mail.host", ""),
                "port", settingService.getValue("mail.port", "25"),
                "username", settingService.getValue("mail.username", ""),
                "smtpAuth", settingService.getValue("mail.smtp-auth", "false"),
                "starttls", settingService.getValue("mail.starttls", "false"),
                "fromAddress", settingService.getValue("mail.from-address", "noreply@peakmate.local"),
                "fromName", settingService.getValue("mail.from-name", "PeakMate")
        );
    }

    // === 내부 메서드 ===

    private String getFromAddress() {
        return settingService.getValue("mail.from-address", "noreply@peakmate.local");
    }

    private String getFromName() {
        return settingService.getValue("mail.from-name", "PeakMate");
    }

    /**
     * DB 설정값으로 JavaMailSender를 동적 생성
     */
    private JavaMailSenderImpl buildMailSender() {
        JavaMailSenderImpl sender = new JavaMailSenderImpl();
        sender.setHost(settingService.getValue("mail.host", "localhost"));
        sender.setPort(Integer.parseInt(settingService.getValue("mail.port", "25")));
        sender.setDefaultEncoding("UTF-8");

        String username = settingService.getValue("mail.username", "");
        String password = settingService.getValue("mail.password", "");
        // 암호화된 비밀번호 복호화 (ENC: 접두사 확인)
        if (password.startsWith("ENC:")) {
            AES256Encryptor encryptor = AES256Encryptor.getInstance();
            if (encryptor.isConfigured()) {
                password = encryptor.decrypt(password.substring(4));
            }
        }
        if (!username.isBlank()) {
            sender.setUsername(username);
            sender.setPassword(password);
        }

        Properties props = sender.getJavaMailProperties();
        props.put("mail.transport.protocol", "smtp");
        props.put("mail.smtp.connectiontimeout", "5000");
        props.put("mail.smtp.timeout", "5000");
        props.put("mail.smtp.writetimeout", "5000");

        boolean smtpAuth = settingService.getBooleanValue("mail.smtp-auth", false);
        boolean starttls = settingService.getBooleanValue("mail.starttls", false);
        props.put("mail.smtp.auth", String.valueOf(smtpAuth));
        props.put("mail.smtp.starttls.enable", String.valueOf(starttls));
        if (starttls) {
            props.put("mail.smtp.ssl.protocols", "TLSv1.2");
        }

        return sender;
    }

    private void sendHtml(String to, String subject, String htmlContent, List<File> attachments)
            throws MessagingException, java.io.UnsupportedEncodingException {
        boolean hasAttachments = attachments != null && !attachments.isEmpty();
        JavaMailSenderImpl sender = buildMailSender();
        MimeMessage message = sender.createMimeMessage();
        MimeMessageHelper helper = new MimeMessageHelper(message, hasAttachments, "UTF-8");

        helper.setFrom(getFromAddress(), getFromName());
        helper.setTo(to);
        helper.setSubject(subject);
        helper.setText(htmlContent, true);

        if (hasAttachments) {
            for (File file : attachments) {
                helper.addAttachment(file.getName(), new FileSystemResource(file));
            }
        }
        mailRetryableSender.send(sender, message);
    }
}
