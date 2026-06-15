package com.peakmate.core.config;

import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.validation.annotation.Validated;

/**
 * 보안 관련 설정 Properties (타입 안전).
 * application.yml의 security.* 속성을 바인딩한다.
 */
@ConfigurationProperties(prefix = "security")
@Validated
public record SecurityProperties(
    Cors cors,
    RateLimit rateLimit,
    Https https,
    AdminIpWhitelist adminIpWhitelist,
    Cookie cookie,
    Encryption encryption,
    Mfa mfa,
    Retention retention
) {
    public record Cors(String allowedOrigins) {
        public Cors { if (allowedOrigins == null) allowedOrigins = "http://localhost:5173"; }
    }
    public record RateLimit(int requestsPerMinute, int loginPerMinute, int apiWritePerMinute, boolean enabled) {
        public RateLimit { if (requestsPerMinute == 0) requestsPerMinute = 120; if (loginPerMinute == 0) loginPerMinute = 10; if (apiWritePerMinute == 0) apiWritePerMinute = 60; }
    }
    public record Https(boolean redirectEnabled) {}
    public record AdminIpWhitelist(boolean enabled, String allowedIps) {
        public AdminIpWhitelist { if (allowedIps == null) allowedIps = ""; }
    }
    public record Cookie(boolean secure) {
        public Cookie { }
    }
    public record Encryption(String key, String previousKey) {
        public Encryption { if (key == null) key = ""; if (previousKey == null) previousKey = ""; }
    }
    public record Mfa(String issuer) {
        public Mfa { if (issuer == null) issuer = "Peakmate"; }
    }
    public record Retention(int systemLogDays, int loginAttemptDays, int auditLogDays, int inactiveUserAnonymizeDays) {
        public Retention { if (systemLogDays == 0) systemLogDays = 365; if (loginAttemptDays == 0) loginAttemptDays = 180; if (auditLogDays == 0) auditLogDays = 730; if (inactiveUserAnonymizeDays == 0) inactiveUserAnonymizeDays = 365; }
    }
}
