package com.peakmate.core.retry;

import org.springframework.boot.autoconfigure.condition.ConditionalOnClass;
import org.springframework.context.annotation.Configuration;
import org.springframework.retry.annotation.EnableRetry;

/**
 * Spring Retry 자동 활성화.
 * spring-retry가 classpath에 있으면 @Retryable 어노테이션이 동작한다.
 */
@Configuration
@ConditionalOnClass(EnableRetry.class)
@EnableRetry
public class RetryAutoConfiguration {
}
