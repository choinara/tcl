package com.peakmate.backend.infra.mail;

import org.springframework.context.annotation.Configuration;
import org.springframework.retry.annotation.EnableRetry;
import org.springframework.scheduling.annotation.EnableAsync;

/**
 * 비동기 메일 발송 + 재시도 설정.
 * @Async 어노테이션 활성화, @EnableRetry로 @Retryable 프록시 활성화.
 */
@Configuration
@EnableAsync
@EnableRetry
public class AsyncConfig {
}
