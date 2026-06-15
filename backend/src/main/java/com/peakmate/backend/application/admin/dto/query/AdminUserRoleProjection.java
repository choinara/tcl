package com.peakmate.backend.application.admin.dto.query;

public record AdminUserRoleProjection(
    Long adminUserId,
    String roleCode
) {}
