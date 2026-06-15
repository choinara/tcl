package com.peakmate.backend.application.admin.dto.query;

import com.peakmate.backend.domain.admin.entity.AdminUserStatus;

import java.time.LocalDateTime;

public record AdminUserWithTeamProjection(
    Long id,
    String username,
    String name,
    String email,
    Long teamId,
    AdminUserStatus status,
    LocalDateTime createdAt,
    LocalDateTime lastLoginAt,
    String teamName
) {}
