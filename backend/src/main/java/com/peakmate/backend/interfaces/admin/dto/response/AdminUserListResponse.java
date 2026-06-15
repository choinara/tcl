package com.peakmate.backend.interfaces.admin.dto.response;

import java.time.LocalDateTime;
import java.util.List;

/**
 * 관리자 사용자 목록 응답 DTO
 */
public record AdminUserListResponse(
    List<AdminUserItem> users,
    Statistics statistics,
    PagingInfo paging
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
     * 사용자 리스트 아이템
     */
    public record AdminUserItem(
        Long id,
        String username,
        String name,
        String email,
        String teamName,
        List<String> roles,
        String status,
        String statusDescription,
        LocalDateTime lastActivityAt
    ) {}

    /**
     * 페이징 정보
     */
    public record PagingInfo(
        int page,
        int size,
        long totalElements,
        int totalPages,
        boolean hasNext,
        boolean hasPrevious
    ) {}
}
