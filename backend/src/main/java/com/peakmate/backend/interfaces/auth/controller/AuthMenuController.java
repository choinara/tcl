package com.peakmate.backend.interfaces.auth.controller;

import com.peakmate.backend.application.menu.dto.result.MenuTreeNode;
import com.peakmate.backend.domain.admin.entity.AdminUser;
import com.peakmate.backend.domain.admin.repository.AdminUserRepository;
import com.peakmate.backend.domain.admin.repository.AdminUserRoleRepository;
import com.peakmate.backend.domain.menu.service.MenuDomainService;
import com.peakmate.core.common.ApiResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

/**
 * 현재 로그인 사용자의 메뉴 트리 조회 API Controller.
 * AuthController의 임시 GET /api/auth/me/menus 엔드포인트를 대체합니다.
 */
@RestController
@RequestMapping("/api/auth/me")
@RequiredArgsConstructor
public class AuthMenuController {

    private final AdminUserRepository adminUserRepository;
    private final AdminUserRoleRepository adminUserRoleRepository;
    private final MenuDomainService menuDomainService;

    /**
     * 현재 로그인된 사용자의 역할에 따른 메뉴 트리를 반환합니다.
     *
     * <p>처리 흐름:
     * <ol>
     *   <li>SecurityContextHolder에서 username 추출</li>
     *   <li>AdminUserRepository로 AdminUser 조회</li>
     *   <li>AdminUserRoleRepository로 역할 ID 목록 조회</li>
     *   <li>MenuDomainService로 역할 기반 메뉴 트리 생성</li>
     * </ol>
     *
     * @return 역할별 권한이 병합된 메뉴 트리
     */
    @GetMapping("/menus")
    public ApiResponse<List<MenuTreeNode>> getMenus() {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        String username = auth.getName();

        AdminUser user = adminUserRepository.findByUsername(username)
                .orElse(null);
        if (user == null) {
            return ApiResponse.error("AUTH001", "사용자를 찾을 수 없습니다.");
        }

        List<Long> roleIds = adminUserRoleRepository.findRoleIdsByAdminUserId(user.getId());
        List<String> roleCodes = adminUserRoleRepository.findRoleCodesByAdminUserId(user.getId());
        boolean isSuperAdmin = roleCodes.contains("SUPER_ADMIN");
        List<MenuTreeNode> tree = menuDomainService.getMenuTreeForRoles(roleIds, user.getId(), isSuperAdmin);

        return ApiResponse.success(tree);
    }
}
