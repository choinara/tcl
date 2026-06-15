package com.peakmate.backend.domain.email.entity;

import com.peakmate.backend.global.util.EncryptedStringConverter;
import com.peakmate.core.audit.AuditableEntity;
import jakarta.persistence.*;
import lombok.Getter;

import java.time.OffsetDateTime;

@Getter
@Entity
@Table(name = "email_oauth_token")
public class EmailOauthToken extends AuditableEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "account_id", nullable = false, unique = true)
    private Long accountId;

    @Column(name = "email_address", length = 320, nullable = false)
    private String emailAddress;

    @Convert(converter = EncryptedStringConverter.class)
    @Column(name = "access_token", columnDefinition = "TEXT", nullable = false)
    private String accessToken;

    @Convert(converter = EncryptedStringConverter.class)
    @Column(name = "refresh_token", columnDefinition = "TEXT", nullable = false)
    private String refreshToken;

    @Column(name = "scope", length = 2000)
    private String scope;

    @Column(name = "token_expiry", nullable = false)
    private OffsetDateTime tokenExpiry;

    @Column(name = "last_refresh_at")
    private OffsetDateTime lastRefreshAt;

    @Column(name = "refresh_failure_count", nullable = false)
    private Integer refreshFailureCount = 0;

    @Column(name = "is_active", length = 1, nullable = false)
    private String isActive = "Y";

    protected EmailOauthToken() {
    }

    public static EmailOauthToken create(Long accountId, String emailAddress,
                                          String accessToken, String refreshToken,
                                          String scope, OffsetDateTime tokenExpiry) {
        EmailOauthToken e = new EmailOauthToken();
        e.accountId = accountId;
        e.emailAddress = emailAddress;
        e.accessToken = accessToken;
        e.refreshToken = refreshToken;
        e.scope = scope;
        e.tokenExpiry = tokenExpiry;
        e.refreshFailureCount = 0;
        e.isActive = "Y";
        return e;
    }

    /**
     * OAuth 토큰 갱신.
     * lastRefreshAt은 토큰 갱신 행위의 비즈니스 타임스탬프이며,
     * AuditableEntity의 자동 관리 대상(@CreatedDate/@LastModifiedDate)과 다르다.
     * 따라서 OffsetDateTime.now() 수동 호출이 적절하다. (Rule 8-1 예외)
     */
    public void updateTokens(String accessToken, String refreshToken, OffsetDateTime tokenExpiry) {
        this.accessToken = accessToken;
        this.refreshToken = refreshToken;
        this.tokenExpiry = tokenExpiry;
        this.lastRefreshAt = OffsetDateTime.now();
        this.refreshFailureCount = 0;
    }

    public void incrementRefreshFailure() {
        this.refreshFailureCount += 1;
    }

    public void deactivate() {
        this.isActive = "N";
    }

    public void activate() {
        this.isActive = "Y";
        this.refreshFailureCount = 0;
    }
}
