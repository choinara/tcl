package com.peakmate.backend.interfaces.usertab.controller;

import com.peakmate.backend.domain.admin.entity.AdminUser;
import com.peakmate.backend.domain.admin.repository.AdminUserRepository;
import com.peakmate.backend.domain.usertab.entity.UserOpenTab;
import com.peakmate.backend.domain.usertab.service.UserOpenTabDomainService;
import com.peakmate.backend.interfaces.usertab.dto.request.SaveTabSessionRequest;
import com.peakmate.backend.interfaces.usertab.dto.request.TabItemDto;
import com.peakmate.backend.interfaces.usertab.dto.response.TabSessionResponse;
import com.peakmate.core.common.ApiResponse;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;

import java.util.List;

/**
 * 사용자 탭 세션 API Controller.
 * 로그인된 사용자 본인의 탭 세션만 조회/저장/삭제합니다.
 * RequirePermission 미적용 — 본인 데이터만 다루므로 인증만 요구.
 */
@RestController
@RequestMapping("/api/auth/me/tab-session")
@RequiredArgsConstructor
public class UserOpenTabController {

    private final UserOpenTabDomainService service;
    private final AdminUserRepository adminUserRepository;

    /**
     * 현재 사용자의 탭 세션을 조회합니다.
     */
    @GetMapping
    public ApiResponse<TabSessionResponse> get() {
        Long adminUserId = resolveAdminUserId();
        if (adminUserId == null) {
            return ApiResponse.error("AUTH001", "사용자를 찾을 수 없습니다.");
        }

        List<UserOpenTab> tabs = service.findByUser(adminUserId);
        List<TabItemDto> items = tabs.stream()
                .map(t -> new TabItemDto(t.getTabPath(), t.getMenuCode(), t.getLabel()))
                .toList();
        String activePath = tabs.stream()
                .filter(UserOpenTab::getIsActive)
                .map(UserOpenTab::getTabPath)
                .findFirst()
                .orElse(null);

        return ApiResponse.success(new TabSessionResponse(items, activePath));
    }

    /**
     * 현재 사용자의 탭 세션을 일괄 저장합니다 (replace 전략).
     */
    @PutMapping
    public ApiResponse<Void> save(@Valid @RequestBody SaveTabSessionRequest request) {
        Long adminUserId = resolveAdminUserId();
        if (adminUserId == null) {
            return ApiResponse.error("AUTH001", "사용자를 찾을 수 없습니다.");
        }

        service.replaceAll(adminUserId, request.tabs(), request.activePath());
        return ApiResponse.success();
    }

    /**
     * 현재 사용자의 탭 세션을 초기화합니다.
     */
    @DeleteMapping
    public ApiResponse<Void> clear() {
        Long adminUserId = resolveAdminUserId();
        if (adminUserId == null) {
            return ApiResponse.error("AUTH001", "사용자를 찾을 수 없습니다.");
        }

        service.clearAll(adminUserId);
        return ApiResponse.success();
    }

    /**
     * SecurityContextHolder에서 username을 꺼내 AdminUser ID를 조회합니다.
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
