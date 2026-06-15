package com.peakmate.backend.interfaces.admin.dto.request;

import com.peakmate.backend.domain.admin.entity.AdminUserStatus;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.Size;

/**
 * 관리자 사용자 목록 조회 요청 DTO
 * GET /api/admin/users
 *
 * @param keyword 통합 검색어 (이름, 아이디, 이메일)
 * @param status 계정 상태 필터
 * @param pendingOnly 대기신청 탭 (true: PENDING 상태만 조회)
 * @param page 페이지 번호 (0-based)
 * @param size 페이지 크기
 */
public record AdminUserListRequest(
    @Size(max = 100, message = "검색어는 100자 이내여야 합니다.")
    String keyword,
    AdminUserStatus status,
    Boolean pendingOnly,
    @Min(value = 0, message = "페이지 번호는 0 이상이어야 합니다")
    Integer page,
    @Min(value = 1, message = "페이지 크기는 1 이상이어야 합니다")
    Integer size
) {
    public AdminUserListRequest {
        if (page == null) page = 0;
        if (size == null) size = 20;
    }
}
