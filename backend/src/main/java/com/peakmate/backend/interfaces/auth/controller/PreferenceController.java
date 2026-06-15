package com.peakmate.backend.interfaces.auth.controller;

import com.peakmate.backend.domain.admin.entity.AdminUser;
import com.peakmate.backend.domain.admin.repository.AdminUserRepository;
import com.peakmate.backend.domain.preference.service.UserPreferenceDomainService;
import com.peakmate.core.common.ApiResponse;
import com.peakmate.backend.interfaces.auth.dto.request.SavePreferencesRequest;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

/**
 * 사용자 환경설정 API Controller.
 * 현재 로그인된 관리자의 환경설정을 조회하고 저장합니다.
 */
@RestController
@RequestMapping("/api/auth/me/preferences")
@RequiredArgsConstructor
public class PreferenceController {

    private final UserPreferenceDomainService userPreferenceDomainService;
    private final AdminUserRepository adminUserRepository;

    /**
     * 현재 로그인된 사용자의 모든 환경설정을 조회합니다.
     *
     * @return key-value 맵 형태의 환경설정
     */
    @GetMapping
    public ApiResponse<Map<String, String>> getPreferences() {
        Long adminUserId = resolveAdminUserId();
        if (adminUserId == null) {
            return ApiResponse.error("AUTH001", "사용자를 찾을 수 없습니다.");
        }
        Map<String, String> preferences = userPreferenceDomainService.getPreferences(adminUserId);
        return ApiResponse.success(preferences);
    }

    /**
     * 현재 로그인된 사용자의 환경설정을 일괄 저장합니다.
     * 값이 빈 문자열이면 해당 키를 삭제합니다.
     *
     * @param body {"preferences": {"key": "value", ...}}
     * @return 성공 응답
     */
    @PutMapping
    public ApiResponse<Void> savePreferences(@Valid @RequestBody SavePreferencesRequest body) {
        Long adminUserId = resolveAdminUserId();
        if (adminUserId == null) {
            return ApiResponse.error("AUTH001", "사용자를 찾을 수 없습니다.");
        }
        Map<String, String> preferences = body.preferences();
        if (preferences != null && !preferences.isEmpty()) {
            userPreferenceDomainService.savePreferences(adminUserId, preferences);
        }
        return ApiResponse.success();
    }

    /**
     * SecurityContextHolder에서 username을 꺼내 AdminUser ID를 조회합니다.
     *
     * @return AdminUser ID, 사용자를 찾을 수 없으면 null
     */
    private Long resolveAdminUserId() {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        if (auth == null || !auth.isAuthenticated()) {
            return null;
        }
        String username = auth.getName();
        return adminUserRepository.findByUsername(username)
                .map(AdminUser::getId)
                .orElse(null);
    }
}
