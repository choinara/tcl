package com.peakmate.backend.interfaces.auth.controller;

import com.peakmate.backend.application.auth.dto.command.TokenReissueCommand;
import com.peakmate.backend.application.auth.dto.result.LoginResult;
import com.peakmate.backend.application.auth.dto.result.TokenReissueResult;
import com.peakmate.backend.application.auth.facade.AuthFacade;
import com.peakmate.backend.domain.admin.entity.AdminUser;
import com.peakmate.backend.domain.admin.repository.AdminUserRepository;
import com.peakmate.backend.domain.admin.repository.AdminUserRoleRepository;
import com.peakmate.backend.domain.admin.service.AdminUserActivityService;
import com.peakmate.backend.domain.auth.service.PasswordPolicyService;
import com.peakmate.backend.domain.auth.service.TotpService;
import com.peakmate.backend.domain.admin.service.AdminUserSessionDomainService;
import com.peakmate.backend.domain.log.service.LoginAttemptService;
import com.peakmate.backend.domain.log.service.SystemLogService;
import com.peakmate.backend.infra.security.util.TokenExtractUtil;
import com.peakmate.core.security.jwt.JwtTokenProvider;
import com.peakmate.backend.interfaces.auth.dto.request.ChangePasswordRequest;
import com.peakmate.backend.interfaces.auth.dto.request.LoginRequest;
import com.peakmate.backend.interfaces.auth.dto.response.LoginResponse;
import com.peakmate.core.security.CookieUtil;
import com.peakmate.core.common.ApiResponse;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import jakarta.validation.Valid;
import java.time.LocalDateTime;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.List;
import java.util.Map;


/**
 * 인증 관련 API Controller.
 * Interface 계층에서 HTTP 요청/응답 처리만 담당합니다.
 */
@Slf4j
@io.swagger.v3.oas.annotations.tags.Tag(name = "인증", description = "로그인/로그아웃/토큰갱신/비밀번호변경 API")
@RestController
@RequestMapping("/api/auth")
@RequiredArgsConstructor
public class AuthController {

    private final AuthFacade authFacade;
    private final AdminUserRepository adminUserRepository;
    private final AdminUserRoleRepository adminUserRoleRepository;
    private final AdminUserActivityService adminUserActivityService;
    private final JwtTokenProvider jwtTokenProvider;
    private final PasswordEncoder passwordEncoder;
    private final SystemLogService systemLogService;
    private final TotpService totpService;
    private final LoginAttemptService loginAttemptService;
    private final PasswordPolicyService passwordPolicyService;
    private final AdminUserSessionDomainService adminUserSessionDomainService;

    @PostMapping("/login")
    public ApiResponse<LoginResponse> login(@Valid @RequestBody LoginRequest loginRequest,
                                            HttpServletRequest httpRequest,
                                            HttpServletResponse httpResponse) {
        String ipAddress = httpRequest.getRemoteAddr();
        String userAgent = httpRequest.getHeader("User-Agent");

        // 1. 사용자 조회
        AdminUser user = adminUserRepository.findByUsername(loginRequest.getUsername()).orElse(null);
        if (user == null) {
            loginAttemptService.recordFailure(loginRequest.getUsername(), ipAddress, userAgent, "사용자 없음");
            try { systemLogService.log("LOGIN_FAIL", null, loginRequest.getUsername(), ipAddress, "로그인 실패", "사용자 없음"); } catch (Exception e) { log.warn("[시스템 로그 기록 실패] LOGIN_FAIL", e); }
            return ApiResponse.error("AUTH001", "사용자명 또는 비밀번호가 올바르지 않습니다.");
        }

        // 2. 계정 잠금 확인
        if (user.isLocked()) {
            loginAttemptService.recordFailure(loginRequest.getUsername(), ipAddress, userAgent, "계정 잠금");
            try { systemLogService.log("LOGIN_FAIL", user.getId(), loginRequest.getUsername(), ipAddress, "로그인 실패", "계정 잠금 상태"); } catch (Exception e) { log.warn("[시스템 로그 기록 실패] LOGIN_FAIL", e); }
            return ApiResponse.error("AUTH005", "계정이 잠겨있습니다. 30분 후 다시 시도하세요.");
        }

        // 3. 비밀번호 검증
        if (!passwordEncoder.matches(loginRequest.getPassword(), user.getPassword())) {
            user.incrementFailedLogin();
            adminUserRepository.save(user);
            if (user.isLocked()) {
                loginAttemptService.recordFailure(loginRequest.getUsername(), ipAddress, userAgent,
                        "비밀번호 5회 오류 → 계정 잠금");
                try { systemLogService.log("ACCOUNT_LOCK", user.getId(), loginRequest.getUsername(), ipAddress, "계정 잠금", "비밀번호 5회 오류로 계정 잠금"); } catch (Exception e) { log.warn("[시스템 로그 기록 실패] ACCOUNT_LOCK", e); }
                return ApiResponse.error("AUTH005", "비밀번호 5회 오류로 계정이 30분간 잠겼습니다.");
            }
            loginAttemptService.recordFailure(loginRequest.getUsername(), ipAddress, userAgent, "비밀번호 불일치");
            try { systemLogService.log("LOGIN_FAIL", user.getId(), loginRequest.getUsername(), ipAddress, "로그인 실패", "비밀번호 불일치"); } catch (Exception e) { log.warn("[시스템 로그 기록 실패] LOGIN_FAIL", e); }
            return ApiResponse.error("AUTH003", "사용자명 또는 비밀번호가 올바르지 않습니다.");
        }

        // 4. MFA 검증
        if (user.isMfaEnabled()) {
            if (loginRequest.getOtpCode() == null || loginRequest.getOtpCode().isBlank()) {
                return ApiResponse.success(LoginResponse.from(LoginResult.ofMfaRequired()));
            }
            if (!totpService.verifyCode(user.getMfaSecret(), loginRequest.getOtpCode())) {
                loginAttemptService.recordFailure(loginRequest.getUsername(), ipAddress, userAgent, "OTP 불일치");
                try { systemLogService.log("LOGIN_FAIL", user.getId(), loginRequest.getUsername(), ipAddress, "로그인 실패", "OTP 인증 실패"); } catch (Exception e) { log.warn("[시스템 로그 기록 실패] LOGIN_FAIL", e); }
                return ApiResponse.error("AUTH006", "OTP 코드가 올바르지 않습니다.");
            }
        }

        // 5. 인증 성공 → 단일 save 후 토큰 발급 (중복 검증/저장 방지)
        user.resetFailedLogin();
        user.updateLastActivity();
        user.updateLastLoginAt(LocalDateTime.now());
        adminUserRepository.save(user);

        LoginResult result = authFacade.loginWithValidatedUser(user, loginRequest.getPassword());

        // 6. 비밀번호 만료 확인 (로그인은 허용, 응답에 포함)
        boolean passwordExpired = user.isPasswordExpired() || user.isMustChangePassword();

        loginAttemptService.recordSuccess(loginRequest.getUsername(), ipAddress, userAgent);

        try {
            systemLogService.log("LOGIN", null, loginRequest.getUsername(), null, "로그인", "로그인 성공");
        } catch (Exception e) {
            log.warn("[시스템 로그 기록 실패] LOGIN, user={}", loginRequest.getUsername(), e);
        }

        // HttpOnly 쿠키 설정 (Access: 35분, Refresh: 3시간)
        CookieUtil.addTokenCookie(httpResponse, CookieUtil.ACCESS_TOKEN_COOKIE, result.accessToken(), 2100);
        if (result.refreshToken() != null) {
            CookieUtil.addTokenCookie(httpResponse, CookieUtil.REFRESH_TOKEN_COOKIE, result.refreshToken(), 10800);
        }

        return ApiResponse.success(LoginResponse.from(result));
    }

    @PostMapping("/logout")
    public ApiResponse<Void> logout(HttpServletRequest httpRequest, HttpServletResponse httpResponse) {
        try {
            Authentication auth = SecurityContextHolder.getContext().getAuthentication();
            if (auth != null) {
                // 현재 요청의 토큰으로 해당 세션만 삭제 (다중 로그인 시 다른 세션 유지)
                String token = TokenExtractUtil.resolve(httpRequest, jwtTokenProvider, CookieUtil.ACCESS_TOKEN_COOKIE);
                if (token != null) {
                    String jti = jwtTokenProvider.getJti(token);
                    if (jti != null) {
                        adminUserSessionDomainService.deleteSessionByJti(jti);
                    }
                }
                systemLogService.log("LOGOUT", null, auth.getName(), null, "로그아웃", "로그아웃");
            }
        } catch (Exception e) {
            log.warn("[시스템 로그 기록 실패] LOGOUT", e);
        }

        SecurityContextHolder.clearContext();

        // HttpOnly 쿠키 삭제
        CookieUtil.clearTokenCookie(httpResponse, CookieUtil.ACCESS_TOKEN_COOKIE);
        CookieUtil.clearTokenCookie(httpResponse, CookieUtil.REFRESH_TOKEN_COOKIE);

        return ApiResponse.success("Logged out");
    }

    /**
     * 현재 로그인된 사용자 정보 조회
     */
    @GetMapping("/me")
    public ApiResponse<Map<String, Object>> me() {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        String username = auth.getName();

        AdminUser user = adminUserRepository.findByUsername(username)
                .orElse(null);
        if (user == null) {
            return ApiResponse.error("AUTH001", "사용자를 찾을 수 없습니다.");
        }

        adminUserActivityService.updateLastActivityAsync(user.getId());

        List<String> roles = adminUserRoleRepository.findRoleCodesByAdminUserId(user.getId());

        Map<String, Object> data = new HashMap<>();
        data.put("id", user.getId());
        data.put("username", user.getUsername());
        data.put("name", user.getName());
        data.put("email", user.getEmail());
        data.put("employeeNumber", "EMP" + String.format("%03d", user.getId()));
        data.put("roles", roles);
        data.put("enabled", user.getStatus() != null && "ACTIVE".equals(user.getStatus().name()));
        data.put("mustChangePassword", user.isMustChangePassword() || user.isPasswordExpired());

        return ApiResponse.success(data);
    }

    /**
     * 토큰 갱신
     * Access Token 또는 Refresh Token으로 새 토큰을 재발급합니다.
     */
    @PostMapping("/refresh")
    public org.springframework.http.ResponseEntity<ApiResponse<Map<String, Object>>> refresh(HttpServletRequest request, HttpServletResponse httpResponse) {
        // 쿠키 폴백: refresh_token 우선, access_token 후순위
        String token = TokenExtractUtil.resolve(request, jwtTokenProvider,
                CookieUtil.REFRESH_TOKEN_COOKIE, CookieUtil.ACCESS_TOKEN_COOKIE);
        if (token == null || !jwtTokenProvider.validateToken(token)) {
            return org.springframework.http.ResponseEntity.status(401)
                    .body(ApiResponse.error("AUTH002", "유효하지 않은 토큰입니다."));
        }

        String username = jwtTokenProvider.getUsername(token);

        // 사용자 1회 로드 — claims/jti/userData 모든 분기에서 공유
        AdminUser user = adminUserRepository.findByUsername(username).orElse(null);
        if (user == null) {
            return org.springframework.http.ResponseEntity.status(401)
                    .body(ApiResponse.error("AUTH001", "사용자를 찾을 수 없습니다."));
        }

        // refresh token이면 DB에서 roles 조회(1회), access token이면 기존 claims 재사용
        List<String> roles;
        Map<String, Object> claims;
        if (jwtTokenProvider.isRefreshToken(token)) {
            roles = adminUserRoleRepository.findRoleCodesByAdminUserId(user.getId());
            claims = new HashMap<>();
            claims.put("roles", roles);
        } else {
            claims = jwtTokenProvider.getClaimsMap(token);
            @SuppressWarnings("unchecked")
            List<String> claimsRoles = (List<String>) claims.getOrDefault("roles", List.of());
            roles = claimsRoles;
        }

        // jti 추출 — user 이미 로드됨, 추가 findByUsername 불필요
        String oldJti;
        if (jwtTokenProvider.isAccessToken(token)) {
            oldJti = jwtTokenProvider.getJti(token);
        } else {
            oldJti = adminUserSessionDomainService.findJtiByUserId(user.getId());
        }
        if (oldJti == null) {
            return org.springframework.http.ResponseEntity.status(401)
                    .body(ApiResponse.error("AUTH002", "세션을 찾을 수 없습니다."));
        }

        TokenReissueResult result;
        try {
            result = authFacade.reissueTokens(new TokenReissueCommand(username, claims, oldJti));
        } catch (IllegalStateException e) {
            // 절대 타임아웃 등 세션 만료 시 쿠키 클리어 + 401
            CookieUtil.clearTokenCookie(httpResponse, CookieUtil.ACCESS_TOKEN_COOKIE);
            CookieUtil.clearTokenCookie(httpResponse, CookieUtil.REFRESH_TOKEN_COOKIE);
            return org.springframework.http.ResponseEntity.status(401)
                    .body(ApiResponse.error("AUTH003", e.getMessage()));
        }

        // 활동 추적 비동기 처리 — user/roles 이미 로드됨, 추가 DB 조회 없음
        adminUserActivityService.updateLastActivityAsync(user.getId());

        Map<String, Object> userData = new HashMap<>();
        userData.put("id", user.getId());
        userData.put("username", user.getUsername());
        userData.put("name", user.getName());
        userData.put("email", user.getEmail());
        userData.put("employeeNumber", "EMP" + String.format("%03d", user.getId()));
        userData.put("roles", roles);
        userData.put("enabled", user.getStatus() != null && "ACTIVE".equals(user.getStatus().name()));

        // HttpOnly 쿠키 갱신 (Access: 35분, Refresh: 3시간)
        CookieUtil.addTokenCookie(httpResponse, CookieUtil.ACCESS_TOKEN_COOKIE, result.accessToken(), 2100);
        if (result.refreshToken() != null) {
            CookieUtil.addTokenCookie(httpResponse, CookieUtil.REFRESH_TOKEN_COOKIE, result.refreshToken(), 10800);
        }

        Map<String, Object> data = new HashMap<>();
        data.put("accessToken", result.accessToken());
        data.put("refreshToken", result.refreshToken());
        data.put("user", userData);
        return org.springframework.http.ResponseEntity.ok(ApiResponse.success(data));
    }

    /**
     * 비밀번호 변경
     */
    @PostMapping("/change-password")
    public ApiResponse<Void> changePassword(@Valid @RequestBody ChangePasswordRequest request) {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        String username = auth.getName();

        String currentPassword = request.currentPassword();
        String newPassword = request.newPassword();

        AdminUser user = adminUserRepository.findByUsername(username).orElse(null);
        if (user == null) {
            return ApiResponse.error("AUTH001", "사용자를 찾을 수 없습니다.");
        }

        if (!passwordEncoder.matches(currentPassword, user.getPassword())) {
            return ApiResponse.error("AUTH005", "현재 비밀번호가 일치하지 않습니다.");
        }

        // 비밀번호 정책 검증
        passwordPolicyService.validatePasswordStrength(newPassword);
        passwordPolicyService.validatePasswordReuse(user.getId(), newPassword);

        // 비밀번호 변경 (PBKDF2 인코딩 + 변경일시 기록)
        String encodedPassword = passwordEncoder.encode(newPassword);
        user.changePasswordWithPolicy(encodedPassword);
        adminUserRepository.save(user);

        // 비밀번호 이력 기록
        passwordPolicyService.recordPasswordChange(user.getId(), encodedPassword);

        // 비밀번호 변경 후 모든 세션 무효화 (보안: 탈취된 토큰 즉시 차단)
        adminUserSessionDomainService.deleteAllSessions(user.getId());

        try { systemLogService.log("PASSWORD_CHANGE", user.getId(), username, null, "비밀번호 변경", "비밀번호 변경 성공 (전체 세션 무효화)"); } catch (Exception e) { log.warn("[시스템 로그 기록 실패] PASSWORD_CHANGE", e); }

        return ApiResponse.success("비밀번호가 변경되었습니다. 다시 로그인해주세요.");
    }
}
