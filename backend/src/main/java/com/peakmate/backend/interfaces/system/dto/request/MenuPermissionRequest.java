package com.peakmate.backend.interfaces.system.dto.request;

import jakarta.validation.constraints.NotNull;

public record MenuPermissionRequest(
        @NotNull(message = "메뉴ID는 필수입니다.")
        Long menuId,

        boolean canRead,
        boolean canCreate,
        boolean canUpdate,
        boolean canDelete,
        boolean canExport,
        boolean canViewPii,
        boolean canApprove
) {}
