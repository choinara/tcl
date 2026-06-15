package com.peakmate.backend.interfaces.system.controller;

import com.peakmate.backend.domain.menu.entity.MenuRolePermission;
import com.peakmate.core.common.ApiResponse;
import com.peakmate.backend.interfaces.system.dto.request.MenuPermissionRequest;
import com.peakmate.backend.infra.repository.menu.MenuRolePermissionJpaRepository;
import com.peakmate.core.log.SystemLog;
import com.peakmate.core.security.annotation.RequirePermission;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

/**
 * 메뉴 권한 관리 API Controller.
 * 역할별 메뉴 권한을 조회/저장합니다.
 */
@Slf4j
@RestController
@RequestMapping("/api/system/menu-auth")
@RequiredArgsConstructor
public class MenuAuthController {

    private final MenuRolePermissionJpaRepository menuRolePermissionJpaRepository;

    /**
     * 특정 역할의 메뉴 권한 목록 조회
     */
    @RequirePermission(menu = "SM0020", action = "read")
    @GetMapping("/{roleId}")
    public ApiResponse<List<Map<String, Object>>> getPermissions(@PathVariable Long roleId) {
        List<MenuRolePermission> perms = menuRolePermissionJpaRepository.findByAdminRoleId(roleId);

        List<Map<String, Object>> result = perms.stream().map(p -> {
            Map<String, Object> map = new java.util.HashMap<>();
            map.put("menuId", p.getMenuId());
            map.put("canRead", "Y".equals(p.getCanRead()));
            map.put("canCreate", "Y".equals(p.getCanCreate()));
            map.put("canUpdate", "Y".equals(p.getCanUpdate()));
            map.put("canDelete", "Y".equals(p.getCanDelete()));
            map.put("canExport", "Y".equals(p.getCanExport()));
            map.put("canViewPii", "Y".equals(p.getCanViewPii()));
            map.put("canApprove", "Y".equals(p.getCanApprove()));
            return map;
        }).collect(Collectors.toList());

        return ApiResponse.success(result);
    }

    /**
     * 특정 역할의 메뉴 권한 일괄 저장
     * 기존 권한을 모두 삭제하고 새로운 권한을 생성합니다.
     */
    @RequirePermission(menu = "SM0020", action = "update")
    @SystemLog(type = "PERMISSION_CHANGE", action = "메뉴 권한 저장")
    @PutMapping("/{roleId}")
    @Transactional
    public ApiResponse<Void> savePermissions(
            @PathVariable Long roleId,
            @Valid @RequestBody List<MenuPermissionRequest> permissions) {

        // 기존 권한 삭제
        menuRolePermissionJpaRepository.deleteByAdminRoleId(roleId);
        menuRolePermissionJpaRepository.flush();

        // 새 권한 저장
        for (MenuPermissionRequest perm : permissions) {
            Long menuId = perm.menuId();
            boolean canRead = perm.canRead();
            boolean canCreate = perm.canCreate();
            boolean canUpdate = perm.canUpdate();
            boolean canDelete = perm.canDelete();
            boolean canExport = perm.canExport();

            boolean canViewPii = perm.canViewPii();
            boolean canApprove = perm.canApprove();

            // 하나라도 권한이 있는 경우에만 저장
            if (canRead || canCreate || canUpdate || canDelete || canExport || canViewPii || canApprove) {
                MenuRolePermission entity = MenuRolePermission.create(
                        menuId, roleId,
                        canRead ? "Y" : "N",
                        canCreate ? "Y" : "N",
                        canUpdate ? "Y" : "N",
                        canDelete ? "Y" : "N",
                        canExport ? "Y" : "N",
                        canViewPii ? "Y" : "N",
                        canApprove ? "Y" : "N"
                );
                menuRolePermissionJpaRepository.save(entity);
            }
        }

        return ApiResponse.success("저장되었습니다");
    }
}
