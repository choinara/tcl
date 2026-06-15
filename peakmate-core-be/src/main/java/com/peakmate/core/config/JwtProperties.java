package com.peakmate.core.config;

import jakarta.validation.constraints.Min;
import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.validation.annotation.Validated;

/**
 * JWT 설정 Properties (타입 안전).
 * application.yml의 jwt.* 속성을 바인딩한다.
 */
@ConfigurationProperties(prefix = "jwt")
@Validated
public record JwtProperties(
    String privateKeyPath,
    String publicKeyPath,
    @Min(60000) long accessTokenValidity,
    @Min(60000) long refreshTokenValidity
) {}
