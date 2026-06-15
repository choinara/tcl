package com.peakmate.backend.domain.admin.entity;

import com.peakmate.core.audit.AuditableEntity;
import jakarta.persistence.*;
import lombok.AccessLevel;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

/**
 * 관리자 사용자의 세션 정보(jti, 만료 시간 등)를 관리하는 엔티티.
 * 1인 1세션 정책: UNIQUE 제약으로 보장 (admin_user_id)
 * jti(JWT ID): Access Token의 고유 식별자 (UUID, RFC 7519 표준)
 */
@Entity
@Table(name = "admin_user_session", uniqueConstraints = {
        @UniqueConstraint(name = "uk_admin_user_session_user_id", columnNames = "admin_user_id")
})
@Getter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
public class AdminUserSession extends AuditableEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "id")
    private Long id;

    @Column(name = "admin_user_id", nullable = false)
    private Long adminUserId;

    @Column(name = "jti", length = 36, nullable = false)
    private String jti;

    @Column(name = "access_token_expires_at", nullable = false)
    private LocalDateTime accessTokenExpiresAt;

    /** 최초 로그인 시각 (절대 타임아웃 기준). 갱신 시 변경하지 않음. */
    @Column(name = "session_started_at", nullable = false)
    private LocalDateTime sessionStartedAt;

    @Builder(access = AccessLevel.PRIVATE)
    private AdminUserSession(Long adminUserId, String jti, LocalDateTime accessTokenExpiresAt, LocalDateTime sessionStartedAt) {
        this.adminUserId = adminUserId;
        this.jti = jti;
        this.accessTokenExpiresAt = accessTokenExpiresAt;
        this.sessionStartedAt = sessionStartedAt;
    }

    /**
     * 세션 정보 생성 정적 팩토리 메서드
     */
    public static AdminUserSession create(Long adminUserId, String jti, LocalDateTime accessTokenExpiresAt) {
        return AdminUserSession.builder()
                .adminUserId(adminUserId)
                .jti(jti)
                .accessTokenExpiresAt(accessTokenExpiresAt)
                .sessionStartedAt(LocalDateTime.now())
                .build();
    }

    /**
     * jti 및 만료 시간을 갱신합니다. (토큰 갱신 시)
     */
    public void updateSession(String jti, LocalDateTime expiresAt) {
        this.jti = jti;
        this.accessTokenExpiresAt = expiresAt;
    }
}
