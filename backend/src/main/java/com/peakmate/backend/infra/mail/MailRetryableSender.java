package com.peakmate.backend.infra.mail;

import jakarta.mail.internet.MimeMessage;
import lombok.extern.slf4j.Slf4j;
import org.springframework.mail.SimpleMailMessage;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.retry.annotation.Backoff;
import org.springframework.retry.annotation.Recover;
import org.springframework.retry.annotation.Retryable;
import org.springframework.stereotype.Component;

/**
 * 메일 발송 재시도 전담 Bean.
 * JavaMailSender를 필드로 주입받지 않고, 메서드 파라미터로 전달받는다.
 * MailService가 DB 설정으로 동적 생성한 JavaMailSenderImpl을 전달한다.
 * @Retryable은 이 Bean에만 적용. MailService(@Async)와 분리하여 프록시 순서 보장.
 */
@Component
@Slf4j
public class MailRetryableSender {

    @Retryable(maxAttempts = 3, backoff = @Backoff(delay = 2000, multiplier = 1.5))
    public void send(JavaMailSender sender, MimeMessage message) {
        sender.send(message);
    }

    @Retryable(maxAttempts = 3, backoff = @Backoff(delay = 2000, multiplier = 1.5))
    public void sendSimple(JavaMailSender sender, SimpleMailMessage message) {
        sender.send(message);
    }

    @Recover
    public void recoverMime(Exception e, JavaMailSender sender, MimeMessage message) {
        log.error("메일 발송 최종 실패 (3회 재시도 후): MimeMessage", e);
    }

    @Recover
    public void recoverSimple(Exception e, JavaMailSender sender, SimpleMailMessage message) {
        log.error("메일 발송 최종 실패 (3회 재시도 후): SimpleMailMessage", e);
    }
}
