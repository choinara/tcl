package com.peakmate.backend.application.auth.dto.query;

import com.peakmate.backend.domain.admin.entity.AdminUserStatus;

/**
 * 관리자 사용자 목록 조회 쿼리 DTO (Application Layer)
 *
 * @param keyword 통합 검색어 (이름, 아이디, 이메일)
 * @param status 계정 상태 필터
 * @param pendingOnly 대기신청 탭 여부
 * @param page 페이지 번호
 * @param size 페이지 크기
 */
public record AdminUserListQuery(
    String keyword,
    AdminUserStatus status,
    boolean pendingOnly,
    int page,
    int size
) {
    /**
     * 기본값을 적용한 팩토리 메서드
     */
    public static AdminUserListQuery of(String keyword, AdminUserStatus status, Boolean pendingOnly, Integer page, Integer size) {
        return new AdminUserListQuery(
            keyword,
            status,
            pendingOnly != null && pendingOnly,
            page != null ? page : 0,
            size != null ? size : 20
        );
    }
}
