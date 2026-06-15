package com.peakmate.backend.infra.security.permission;

import com.peakmate.backend.domain.admin.entity.AdminUser;
import com.peakmate.backend.domain.admin.repository.AdminUserRepository;
import com.peakmate.backend.domain.admin.repository.AdminUserRoleRepository;
import com.peakmate.backend.domain.menu.entity.SystemMenu;
import com.peakmate.backend.domain.menu.service.MenuDomainService;
import com.peakmate.backend.infra.repository.menu.SystemMenuJpaRepository;
import com.peakmate.core.security.annotation.RequirePermission;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.aspectj.lang.ProceedingJoinPoint;
import org.aspectj.lang.annotation.Around;
import org.aspectj.lang.annotation.Aspect;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Component;

import java.util.List;

/**
 * @RequirePermission AOP.
 * 역할 기반 권한 + 사용자별 예외권한을 모두 반영하여 권한을 체크합니다.
 * OrbitMES의 PermissionCheckAspect와 동일한 패턴입니다.
 */
@Aspect
@Component
@Slf4j
@RequiredArgsConstructor
public class PermissionCheckAspect {

    private final AdminUserRepository adminUserRepository;
    private final AdminUserRoleRepository adminUserRoleRepository;
    private final SystemMenuJpaRepository systemMenuJpaRepository;
    private final MenuDomainService menuDomainService;

    @Around("@annotation(requirePermission)")
    public Object checkPermission(ProceedingJoinPoint joinPoint, RequirePermission requirePermission) throws Throwable {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        if (authentication == null || !authentication.isAuthenticated()) {
            throw new AccessDeniedException("인증이 필요합니다");
        }

        String username = authentication.getName();
        AdminUser user = adminUserRepository.findByUsername(username)
                .orElseThrow(() -> new AccessDeniedException("사용자를 찾을 수 없습니다"));

        String action = requirePermission.action();

        // menus() 우선, 없으면 menu() 단일 코드 사용 (하위 호환)
        String[] menuCodes = requirePermission.menus().length > 0
                ? requirePermission.menus()
                : new String[]{requirePermission.menu()};

        List<Long> roleIds = adminUserRoleRepository.findRoleIdsByAdminUserId(user.getId());
        if (roleIds.isEmpty()) {
            throw new AccessDeniedException("권한이 없습니다: " + String.join(",", menuCodes) + " / " + action);
        }

        // SUPER_ADMIN은 비활성 메뉴 포함 모든 API에 전권 부여
        List<String> roleCodes = adminUserRoleRepository.findRoleCodesByAdminUserId(user.getId());
        if (roleCodes.contains("SUPER_ADMIN")) {
            return joinPoint.proceed();
        }

        // 복수 메뉴 OR 조건: 하나라도 권한 있으면 통과
        for (String menuCode : menuCodes) {
            SystemMenu menu = systemMenuJpaRepository.findByMenuCode(menuCode).orElse(null);
            if (menu == null) {
                log.warn("Menu not found: menuCode={}", menuCode);
                continue;
            }
            MenuDomainService.PermissionSet perm =
                    menuDomainService.getUserPermissionForMenu(roleIds, user.getId(), menu.getId());
            if (perm.hasAction(action)) {
                return joinPoint.proceed();
            }
        }

        log.warn("Permission denied: user={}, menus={}, action={}", username, String.join(",", menuCodes), action);
        throw new AccessDeniedException("권한이 없습니다: " + String.join(",", menuCodes) + " / " + action);
    }
}
