package com.peakmate.backend.domain.admin.repository;

import com.peakmate.backend.domain.admin.entity.AdminUser;
import com.peakmate.backend.domain.admin.entity.AdminUserStatus;
import org.springframework.lang.NonNull;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

/**
 * AdminUser Repository 인터페이스.
 * Domain 계층에서 정의하고, Infra 계층에서 구현합니다.
 */
public interface AdminUserRepository {

    /**
     * username으로 AdminUser 조회
     */
    Optional<AdminUser> findByUsername(String username);

    /**
     * ID로 AdminUser 조회
     */
    Optional<AdminUser> findById(@NonNull Long id);

    /**
     * AdminUser 존재 여부 확인
     */
    boolean existsById(@NonNull Long id);

    /**
     * AdminUser 저장 (업데이트 포함)
     */
    AdminUser save(AdminUser adminUser);

    /**
     * 사용자 목록 조회 (페이징)
     */
    java.util.List<AdminUser> findAll(int page, int size);

    /**
     * 전체 사용자 수 조회
     */
    long count();

    /**
     * 상태별 사용자 수 조회
     */
    long countByStatus(com.peakmate.backend.domain.admin.entity.AdminUserStatus status);

    /**
     * 현재 활동 중인 사용자 수 조회 (토큰 만료 기준)
     */
    long countActiveUsers();

    /**
     * 상태별 사용자 목록 조회
     */
    java.util.List<AdminUser> findByStatus(com.peakmate.backend.domain.admin.entity.AdminUserStatus status);

    /**
     * 휴면 계정 조회 (특정 상태 + 마지막 활동일 기준)
     */
    List<AdminUser> findByStatusAndLastActivityAtBefore(AdminUserStatus status, LocalDateTime cutoff);

    /**
     * 복수 사용자 일괄 저장
     */
    List<AdminUser> saveAll(List<AdminUser> users);

    /**
     * 사용자 검색 (필터링, 페이징, 통계 포함)
     *
     * @param keyword 통합 검색어 (이름, 아이디, 이메일)
     * @param status 계정 상태 필터
     * @param pendingOnly 대기신청만 조회 여부
     * @param page 페이지 번호
     * @param size 페이지 크기
     * @return 검색 결과와 통계
     */
    com.peakmate.backend.application.admin.dto.result.AdminUserSearchResultDto searchUsers(
            String keyword,
            com.peakmate.backend.domain.admin.entity.AdminUserStatus status,
            boolean pendingOnly,
            int page,
            int size
    );
}
