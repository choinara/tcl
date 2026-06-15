package com.peakmate.backend.global.config;

import org.springframework.boot.autoconfigure.domain.EntityScan;
import org.springframework.context.annotation.Configuration;
import org.springframework.data.jpa.repository.config.EnableJpaRepositories;

/**
 * JPA 설정.
 * e-approval 모듈의 @EnableJpaRepositories가 Spring Boot 자동 스캔을 비활성화하므로
 * 메인 앱의 JPA 레포지토리와 엔티티를 명시적으로 등록합니다.
 */
@Configuration
@EntityScan(basePackages = "com.peakmate.backend")
@EnableJpaRepositories(basePackages = "com.peakmate.backend")
public class JpaConfig {
}
