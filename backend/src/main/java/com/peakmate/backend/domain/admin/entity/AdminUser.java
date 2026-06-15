package com.peakmate.backend.domain.admin.entity;

import com.peakmate.core.audit.AuditableEntity;
import com.peakmate.backend.global.util.EncryptedStringConverter;
import jakarta.persistence.*;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import lombok.Getter;
import lombok.Setter;

import java.time.LocalDate;
import java.time.LocalDateTime;

@Getter
@Entity
@Table(name = "admin_user")
public class AdminUser extends AuditableEntity {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "seq_id", nullable = false)
    private Long id;

    @Column(name = "team_id")
    private Long teamId;

    @Size(max = 50)
    @Column(name = "username", length = 50)
    private String username;

    @Size(max = 200)
    @Column(name = "password", length = 200)
    private String password;

    @Size(max = 100)
    @Column(name = "name", length = 100)
    private String name;

    @Size(max = 200)
    @Column(name = "email", length = 200)
    @Convert(converter = EncryptedStringConverter.class)
    private String email;

    @Size(max = 200)
    @Column(name = "phone_number", length = 200)
    @Convert(converter = EncryptedStringConverter.class)
    private String phoneNumber;

    @Column(name = "birthday")
    private LocalDate birthday;

    @Size(max = 200)
    @Column(name = "postal_code", length = 200)
    @Convert(converter = EncryptedStringConverter.class)
    private String postalCode;

    @Size(max = 1000)
    @Column(name = "address_base", length = 1000)
    @Convert(converter = EncryptedStringConverter.class)
    private String addressBase;

    @Size(max = 1000)
    @Column(name = "address_detail", length = 1000)
    @Convert(converter = EncryptedStringConverter.class)
    private String addressDetail;

    @Enumerated(EnumType.STRING)
    @Column(name = "status", length = 20)
    private AdminUserStatus status;

    @Column(name = "last_login_at")
    private LocalDateTime lastLoginAt;

    /**
     * 퀄리티 관리 메시지 수신 여부 (Y/N)
     */
    @Size(max = 1)
    @Column(name = "qu_msg_yn", length = 1, columnDefinition = "CHAR(1)")
    private String quMsgYn;

    /**
     * MFA 활성화 여부
     */
    @Setter
    @Column(name = "mfa_enabled", nullable = false)
    private boolean mfaEnabled = false;

    /**
     * MFA TOTP 시크릿 키
     */
    @Setter
    @Size(max = 64)
    @Column(name = "mfa_secret", length = 64)
    private String mfaSecret;

    // === 보안 강화 필드 (PIPA/RFP) ===

    /**
     * 로그인 실패 횟수
     */
    @Column(name = "failed_login_count", nullable = false)
    private int failedLoginCount = 0;

    /**
     * 계정 잠금 해제 시각
     */
    @Column(name = "locked_until")
    private LocalDateTime lockedUntil;

    /**
     * 마지막 비밀번호 변경일시
     */
    @Column(name = "password_changed_at")
    private LocalDateTime passwordChangedAt;

    /**
     * 비밀번호 변경 필수 여부
     */
    @Column(name = "must_change_password", nullable = false)
    private boolean mustChangePassword = false;

    /**
     * 마지막 활동 일시 (휴면 계정 판별용)
     */
    @Column(name = "last_activity_at")
    private LocalDateTime lastActivityAt;

    /**
     * 회원가입 정적 팩토리 메서드
     * teamId, contractStatus, roleCodes는 관리자가 나중에 설정합니다.
     */
    public static AdminUser signUp(String username, String password, String name, String email,
            String phoneNumber, LocalDate birthday, String postalCode, String addressBase,
            String addressDetail) {
        AdminUser adminUser = new AdminUser();
        adminUser.username = username;
        adminUser.password = password;
        adminUser.name = name;
        adminUser.email = email;
        adminUser.phoneNumber = phoneNumber;
        adminUser.birthday = birthday;
        adminUser.postalCode = postalCode;
        adminUser.addressBase = addressBase;
        adminUser.addressDetail = addressDetail;
        adminUser.teamId = null;                    // 관리자가 나중에 설정
        adminUser.status = AdminUserStatus.PENDING; // 기본값: 승인대기
        return adminUser;
    }

    /**
     * 마지막 로그인 시간 업데이트
     */
    public void updateLastLoginAt(LocalDateTime loginAt) {
        this.lastLoginAt = loginAt;
    }

    /**
     * 비밀번호를 변경합니다.
     */
    public void changePassword(String encodedPassword) {
        this.password = encodedPassword;
    }

    public void updateName(String name) {
        this.name = name;
    }

    public void updateEmail(String email) {
        this.email = email;
    }

    /**
     * 시스템 관리에서 사용자를 생성합니다.
     */
    public static AdminUser create(String username, String password, String name, String email, String phoneNumber) {
        AdminUser user = new AdminUser();
        user.username = username;
        user.password = password;
        user.name = name;
        user.email = email;
        user.phoneNumber = phoneNumber;
        user.status = AdminUserStatus.ACTIVE;
        return user;
    }

    public void toggleStatus() {
        this.status = (this.status == AdminUserStatus.ACTIVE)
                ? AdminUserStatus.INACTIVE
                : AdminUserStatus.ACTIVE;
    }

    public void deactivate() {
        this.status = AdminUserStatus.INACTIVE;
    }

    // === 계정 잠금 관련 ===

    /**
     * 계정이 잠겨있는지 확인
     */
    public boolean isLocked() {
        return lockedUntil != null && lockedUntil.isAfter(LocalDateTime.now());
    }

    /**
     * 로그인 실패 시 호출. 5회 실패 시 30분 잠금.
     */
    public void incrementFailedLogin() {
        this.failedLoginCount++;
        if (this.failedLoginCount >= 5) {
            this.lockedUntil = LocalDateTime.now().plusMinutes(30);
        }
    }

    /**
     * 로그인 성공 시 실패 횟수 초기화
     */
    public void resetFailedLogin() {
        this.failedLoginCount = 0;
        this.lockedUntil = null;
    }

    // === 비밀번호 정책 관련 ===

    /**
     * 비밀번호가 만료되었는지 확인 (90일)
     */
    public boolean isPasswordExpired() {
        if (passwordChangedAt == null) return true;
        return passwordChangedAt.plusDays(90).isBefore(LocalDateTime.now());
    }

    /**
     * 비밀번호 변경 (변경일시 기록)
     */
    public void changePasswordWithPolicy(String encodedPassword) {
        this.password = encodedPassword;
        this.passwordChangedAt = LocalDateTime.now();
        this.mustChangePassword = false;
    }

    /**
     * 다음 로그인 시 비밀번호 변경 강제
     */
    public void forcePasswordChange() {
        this.mustChangePassword = true;
    }

    // === 활동 추적 ===

    /**
     * 마지막 활동 시각 업데이트
     */
    public void updateLastActivity() {
        this.lastActivityAt = LocalDateTime.now();
    }
}