package com.peakmate.backend.interfaces.system.controller;

import com.peakmate.backend.domain.menu.entity.UserPermission;
import com.peakmate.backend.domain.menu.repository.MenuRepository;
import com.peakmate.core.common.ApiResponse;
import com.peakmate.core.log.SystemLog;
import com.peakmate.core.security.annotation.RequirePermission;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.*;

import java.util.ArrayList;
import java.util.List;

/**
 * 사용자별 예외권한 관리 API Controller.
 * OrbitMES의 UserAuthController와 동일한 패턴입니다.
 */
@Slf4j
@RestController
@RequestMapping("/api/system/user-auth")
@RequiredArgsConstructor
public class UserAuthController {

    private final MenuRepository menuRepository;

    /**
     * 특정 사용자의 예외권한 목록을 조회합니다.
     */
    @RequirePermission(menu = "SM0050", action = "read")
    @GetMapping("/{userId}")
    public ApiResponse<List<UserPermissionDto>> findByUserId(@PathVariable Long userId) {
        List<UserPermission> permissions = menuRepository.findUserPermissionsByUserId(userId);
        List<UserPermissionDto> dtos = permissions.stream()
                .map(UserPermissionDto::from)
                .toList();
        return ApiResponse.success(dtos);
    }

    /**
     * 특정 사용자의 예외권한을 저장합니다.
     * 기존 권한을 모두 삭제 후 새로 저장합니다 (OrbitMES 패턴).
     */
    @RequirePermission(menu = "SM0050", action = "update")
    @SystemLog(type = "PERMISSION_CHANGE", action = "사용자 예외권한 저장")
    @PutMapping("/{userId}")
    @Transactional
    public ApiResponse<List<UserPermissionDto>> savePermissions(
            @PathVariable Long userId,
            @Valid @RequestBody List<UserPermissionRequest> permissions
    ) {
        // 기존 예외권한 전부 삭제
        menuRepository.deleteUserPermissionsByUserId(userId);

        // 하나라도 권한이 있는 것만 저장
        List<UserPermission> saved = new ArrayList<>();
        for (UserPermissionRequest req : permissions) {
            UserPermission up = UserPermission.create(
                    userId, req.menuId(),
                    boolToYn(req.canRead()), boolToYn(req.canCreate()),
                    boolToYn(req.canUpdate()), boolToYn(req.canDelete()),
                    boolToYn(req.canExport()), boolToYn(req.canViewPii()),
                    boolToYn(req.canApprove())
            );
            if (up.hasAnyPermission()) {
                saved.add(menuRepository.saveUserPermission(up));
            }
        }

        List<UserPermissionDto> dtos = saved.stream()
                .map(UserPermissionDto::from)
                .toList();

        return ApiResponse.success(dtos, "권한 저장 완료");
    }

    private static String boolToYn(boolean value) {
        return value ? "Y" : "N";
    }

    record UserPermissionRequest(
            Long menuId,
            boolean canRead,
            boolean canCreate,
            boolean canUpdate,
            boolean canDelete,
            boolean canExport,
            boolean canViewPii,
            boolean canApprove
    ) {}

    record UserPermissionDto(
            Long menuId,
            boolean canRead,
            boolean canCreate,
            boolean canUpdate,
            boolean canDelete,
            boolean canExport,
            boolean canViewPii,
            boolean canApprove
    ) {
        static UserPermissionDto from(UserPermission up) {
            return new UserPermissionDto(
                    up.getMenuId(),
                    "Y".equals(up.getCanRead()),
                    "Y".equals(up.getCanCreate()),
                    "Y".equals(up.getCanUpdate()),
                    "Y".equals(up.getCanDelete()),
                    "Y".equals(up.getCanExport()),
                    "Y".equals(up.getCanViewPii()),
                    "Y".equals(up.getCanApprove())
            );
        }
    }
}
