package com.peakmate.backend.interfaces.auth.controller;

import com.peakmate.backend.domain.admin.entity.AdminUser;
import com.peakmate.backend.domain.admin.repository.AdminUserRepository;
import com.peakmate.backend.domain.auth.service.TotpService;
import com.peakmate.core.common.ApiResponse;
import com.peakmate.backend.global.error.PeakmateErrorCode;
import com.peakmate.core.error.EntityNotFoundException;
import com.peakmate.backend.interfaces.auth.dto.request.MfaCodeRequest;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.*;

import java.security.Principal;
import java.util.Map;

/**
 * MFA(Multi-Factor Authentication) API Controller.
 * TOTP 기반 2차 인증 설정/검증을 제공합니다.
 */
@RestController
@RequestMapping("/api/auth/mfa")
@RequiredArgsConstructor
public class MfaController {

    private final TotpService totpService;
    private final AdminUserRepository adminUserRepository;

    @PostMapping("/setup")
    @Transactional
    public ApiResponse<Map<String, String>> setupMfa(Principal principal) {
        AdminUser user = findUser(principal.getName());

        String secret = totpService.generateSecret();
        user.setMfaSecret(secret);
        adminUserRepository.save(user);

        String qrCodeBase64 = totpService.generateQrCodeBase64(secret, user.getUsername());

        return ApiResponse.success(Map.of(
                "secret", secret,
                "qrCode", "data:image/png;base64," + qrCodeBase64
        ), "QR코드가 생성되었습니다. 인증 앱에서 스캔하세요.");
    }

    @PostMapping("/verify-setup")
    @Transactional
    public ApiResponse<Void> verifySetup(Principal principal, @Valid @RequestBody MfaCodeRequest request) {
        String code = request.code();

        AdminUser user = findUser(principal.getName());
        if (user.getMfaSecret() == null) {
            return ApiResponse.error("MFA002", "MFA 설정이 시작되지 않았습니다. 먼저 /setup을 호출하세요.");
        }

        if (!totpService.verifyCode(user.getMfaSecret(), code)) {
            return ApiResponse.error("MFA003", "OTP 코드가 올바르지 않습니다.");
        }

        user.setMfaEnabled(true);
        adminUserRepository.save(user);

        return ApiResponse.success("MFA가 활성화되었습니다.");
    }

    @PostMapping("/disable")
    @Transactional
    public ApiResponse<Void> disableMfa(Principal principal, @Valid @RequestBody MfaCodeRequest request) {
        String code = request.code();
        AdminUser user = findUser(principal.getName());

        if (!user.isMfaEnabled()) {
            return ApiResponse.error("MFA004", "MFA가 활성화되어 있지 않습니다.");
        }

        if (!totpService.verifyCode(user.getMfaSecret(), code)) {
            return ApiResponse.error("MFA003", "OTP 코드가 올바르지 않습니다.");
        }

        user.setMfaEnabled(false);
        user.setMfaSecret(null);
        adminUserRepository.save(user);

        return ApiResponse.success("MFA가 비활성화되었습니다.");
    }

    @GetMapping("/status")
    public ApiResponse<Map<String, Boolean>> mfaStatus(Principal principal) {
        AdminUser user = findUser(principal.getName());
        return ApiResponse.success(Map.of("mfaEnabled", user.isMfaEnabled()));
    }

    private AdminUser findUser(String username) {
        return adminUserRepository.findByUsername(username)
                .orElseThrow(() -> new EntityNotFoundException(PeakmateErrorCode.MEMBER_NOT_FOUND));
    }
}
