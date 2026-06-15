package com.peakmate.backend.application.admin.dto.result;

import com.peakmate.backend.domain.admin.entity.AdminUserStatus;

import java.time.LocalDateTime;
import java.util.List;

/**
 * Application 계층의 사용자 검색 결과 DTO
 * Repository에서 QueryDSL Projection으로 생성됩니다.
 */
public record AdminUserSearchResultDto(
    List<AdminUserSearchItem> users,
    long totalElements,
    long totalCount,
    long pendingCount,
    long activeCount
) {
    /**
     * 검색된 사용자 정보 (팀, 권한 포함)
     */
    public record AdminUserSearchItem(
        Long id,
        String username,
        String name,
        String email,
        Long teamId,
        String teamName,
        AdminUserStatus status,
        List<String> roles,
        LocalDateTime createdAt,
        LocalDateTime lastLoginAt
    ) {}
}
