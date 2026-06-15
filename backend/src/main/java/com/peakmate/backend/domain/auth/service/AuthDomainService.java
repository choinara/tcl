package com.peakmate.backend.domain.auth.service;

import com.peakmate.backend.domain.auth.AuthTokens;
import com.peakmate.backend.domain.auth.PasswordEncoder;
import com.peakmate.backend.domain.auth.PasswordMatcher;
import com.peakmate.core.security.TokenProvider;
import com.peakmate.backend.domain.admin.entity.AdminUser;
import com.peakmate.backend.domain.admin.repository.AdminUserRepository;
import com.peakmate.backend.domain.admin.repository.AdminUserRoleRepository;
import com.peakmate.core.error.CommonErrorCode;
import com.peakmate.backend.global.error.PeakmateErrorCode;
import com.peakmate.core.error.BusinessException;
import com.peakmate.backend.domain.admin.service.AdminUserSessionDomainService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

/**
 * 인증 관련 도메인 로직을 담당하는 서비스.
 * Application 계층에서 AdminUser 기반 인증을 수행합니다.
 */
@Service
@RequiredArgsConstructor
@Slf4j
public class AuthDomainService {

    private final AdminUserRepository adminUserRepository;
    private final AdminUserRoleRepository adminUserRoleRepository;
    private final TokenProvider tokenProvider;
    private final PasswordMatcher passwordMatcher;
    private final PasswordEncoder passwordEncoder;
    private final AdminUserSessionDomainService adminUserSessionDomainService;

    /**
     * 관리자 인증 및 토큰 생성
     *
     * @param username 사용자 ID
     * @param password 비밀번호
     * @return 생성된 토큰 정보 (accessToken, refreshToken)
     */
    @Transactional
    public AuthTokens authenticate(String username, String password) {
        // 관리자 조회
        AdminUser adminUser = adminUserRepository.findByUsername(username)
                .orElseThrow(() -> new BusinessException(PeakmateErrorCode.MEMBER_NOT_FOUND));

        // 비밀번호 검증 (암호화된 비밀번호와 매칭)
        log.info("Authenticating user {}", username);
        if (!passwordMatcher.matches(password, adminUser.getPassword())) {
            throw new BusinessException(CommonErrorCode.INVALID_PASSWORD);
        }

        // 비밀번호 마이그레이션 (필요 시)
        if (passwordMatcher.needsMigration(adminUser.getPassword())) {
            log.info("Migrating password for user: {}", username);
            String bcryptPassword = passwordEncoder.encode(password);
            adminUser.changePassword(bcryptPassword);
        }

        // Role 조회
        List<String> roles = adminUserRoleRepository.findRoleCodesByAdminUserId(adminUser.getId());

        // lastLoginAt 업데이트
        adminUser.updateLastLoginAt(LocalDateTime.now());
        adminUserRepository.save(adminUser);

        // JWT claims에 role 정보만 추가 (name은 개인정보이므로 /api/auth/me에서 조회)
        Map<String, Object> claims = new HashMap<>();
        claims.put("roles", roles);

        String accessToken = tokenProvider.createAccessToken(username, claims);
        String refreshToken = tokenProvider.createRefreshToken(username);

        // 세션 정보 저장 (jti로 세션 식별)
        String jti = tokenProvider.getJti(accessToken);
        LocalDateTime expiresAt = tokenProvider.getExpiration(accessToken);
        adminUserSessionDomainService.updateSession(adminUser.getId(), jti, expiresAt);

        return new AuthTokens(accessToken, refreshToken);
    }

    /**
     * 토큰 재발행 및 세션 갱신
     * Access Token과 Refresh Token 모두 재발급합니다.
     * 세션 정보에는 Access Token만 저장됩니다.
     *
     * @param username       사용자 ID
     * @param claims         기존 클레임 정보
     * @param oldAccessToken 기존 Access Token (세션 갱신 시 교체 대상)
     * @return 재발급된 토큰 정보 (accessToken, refreshToken)
     */
    /**
     * 이미 검증된 AdminUser로 토큰 발급 (중복 검증 방지용)
     * AuthController에서 비밀번호 검증을 완료한 뒤 호출한다.
     * lastLoginAt / resetFailedLogin / updateLastActivity 저장은 Controller에서 처리.
     */
    @Transactional
    public AuthTokens generateTokensForValidatedUser(AdminUser adminUser, String rawPassword) {
        // 비밀번호 마이그레이션 (필요 시 — BCrypt → PBKDF2)
        if (passwordMatcher.needsMigration(adminUser.getPassword())) {
            log.info("Migrating password for user: {}", adminUser.getUsername());
            String migratedPassword = passwordEncoder.encode(rawPassword);
            adminUser.changePassword(migratedPassword);
            adminUserRepository.save(adminUser);
        }

        List<String> roles = adminUserRoleRepository.findRoleCodesByAdminUserId(adminUser.getId());
        Map<String, Object> claims = new HashMap<>();
        claims.put("roles", roles);

        String accessToken = tokenProvider.createAccessToken(adminUser.getUsername(), claims);
        String refreshToken = tokenProvider.createRefreshToken(adminUser.getUsername());

        String jti = tokenProvider.getJti(accessToken);
        LocalDateTime expiresAt = tokenProvider.getExpiration(accessToken);
        adminUserSessionDomainService.updateSession(adminUser.getId(), jti, expiresAt);

        return new AuthTokens(accessToken, refreshToken);
    }

    @Transactional
    public AuthTokens reissueTokens(String username, Map<String, Object> claims, String oldJti) {
        // 신규 토큰 생성
        String newAccessToken = tokenProvider.createAccessToken(username, claims);
        String newRefreshToken = tokenProvider.createRefreshToken(username);
        String newJti = tokenProvider.getJti(newAccessToken);
        LocalDateTime expiresAt = tokenProvider.getExpiration(newAccessToken);

        // 기존 세션의 jti를 새 jti로 교체
        adminUserSessionDomainService.refreshSession(oldJti, newJti, expiresAt);

        return new AuthTokens(newAccessToken, newRefreshToken);
    }

    /**
     * Refresh Token만 재발급
     * 세션 정보는 업데이트하지 않음 (세션 연장 효과 없음)
     *
     * @param username 사용자 ID
     * @return 재발급된 Refresh Token
     */
    public String reissueRefreshToken(String username) {
        // 사용자 존재 확인
        adminUserRepository.findByUsername(username)
                .orElseThrow(() -> new BusinessException(PeakmateErrorCode.MEMBER_NOT_FOUND));

        return tokenProvider.createRefreshToken(username);
    }
}
