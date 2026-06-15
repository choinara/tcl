package com.peakmate.backend.application.auth.dto.result;

import com.peakmate.backend.domain.admin.entity.AdminUserStatus;
import java.time.LocalDateTime;
import java.util.List;

/**
 * 관리자 사용자 목록/검색 결과 DTO (Application Layer)
 */
public record AdminUserListResult(
    List<AdminUserInfo> users,
    Statistics statistics,
    PagingMetadata paging
) {
    /**
     * 통계 정보
     */
    public record Statistics(
        long totalCount,
        long pendingCount,
        long activeCount
    ) {}

    /**
     * 사용자 정보
     */
    public record AdminUserInfo(
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

    /**
     * 페이징 메타데이터
     */
    public record PagingMetadata(
        int page,
        int size,
        long totalElements,
        int totalPages,
        boolean hasNext,
        boolean hasPrevious
    ) {}
}
