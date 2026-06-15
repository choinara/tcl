package com.peakmate.backend.interfaces.auth.controller;

import com.peakmate.backend.domain.admin.entity.AdminUser;
import com.peakmate.backend.domain.admin.repository.AdminUserRepository;
import com.peakmate.backend.domain.auth.entity.ConsentHistory;
import com.peakmate.backend.domain.auth.service.ConsentService;
import com.peakmate.core.common.ApiResponse;
import com.peakmate.backend.interfaces.auth.dto.request.ConsentRequest;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;

import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

/**
 * 개인정보 수집/이용 동의 관리 API.
 */
@io.swagger.v3.oas.annotations.tags.Tag(name = "개인정보 동의", description = "개인정보 수집/이용 동의 이력 관리 API")
@RestController
@RequestMapping("/api/auth/consent")
@RequiredArgsConstructor
public class ConsentController {

    private final ConsentService consentService;
    private final AdminUserRepository adminUserRepository;

    /**
     * 동의 기록
     */
    @PostMapping
    public ApiResponse<Map<String, Object>> recordConsent(
            @Valid @RequestBody ConsentRequest consentRequest,
            HttpServletRequest request) {

        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        String username = auth.getName();
        AdminUser user = adminUserRepository.findByUsername(username).orElse(null);
        if (user == null) {
            return ApiResponse.error("AUTH001", "사용자를 찾을 수 없습니다.");
        }

        ConsentHistory history = consentService.recordConsent(
                user.getId(), consentRequest.consentType(), consentRequest.consentVersion(),
                consentRequest.consented(),
                request.getRemoteAddr(), request.getHeader("User-Agent"));

        Map<String, Object> result = new LinkedHashMap<>();
        result.put("id", history.getId());
        result.put("consentType", history.getConsentType());
        result.put("consentVersion", history.getConsentVersion());
        result.put("consented", history.isConsented());
        result.put("consentedAt", history.getConsentedAt());

        return ApiResponse.success(result);
    }

    /**
     * 내 동의 이력 조회
     */
    @GetMapping("/history")
    public ApiResponse<List<Map<String, Object>>> getMyConsentHistory() {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        String username = auth.getName();
        AdminUser user = adminUserRepository.findByUsername(username).orElse(null);
        if (user == null) {
            return ApiResponse.error("AUTH001", "사용자를 찾을 수 없습니다.");
        }

        List<Map<String, Object>> result = consentService.getUserConsentHistory(user.getId())
                .stream()
                .map(h -> {
                    Map<String, Object> map = new LinkedHashMap<>();
                    map.put("id", h.getId());
                    map.put("consentType", h.getConsentType());
                    map.put("consentVersion", h.getConsentVersion());
                    map.put("consented", h.isConsented());
                    map.put("consentedAt", h.getConsentedAt());
                    return map;
                })
                .collect(Collectors.toList());

        return ApiResponse.success(result);
    }

    /**
     * 특정 동의 유형의 현재 동의 상태 확인
     */
    @GetMapping("/status")
    public ApiResponse<Map<String, Object>> checkConsentStatus(@RequestParam String consentType) {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        String username = auth.getName();
        AdminUser user = adminUserRepository.findByUsername(username).orElse(null);
        if (user == null) {
            return ApiResponse.error("AUTH001", "사용자를 찾을 수 없습니다.");
        }

        boolean hasConsent = consentService.hasActiveConsent(user.getId(), consentType);

        Map<String, Object> result = new LinkedHashMap<>();
        result.put("consentType", consentType);
        result.put("consented", hasConsent);

        return ApiResponse.success(result);
    }
}
