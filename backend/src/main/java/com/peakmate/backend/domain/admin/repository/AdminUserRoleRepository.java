package com.peakmate.backend.domain.admin.repository;

import java.util.List;

/**
 * AdminUserRole Repository 인터페이스.
 * 사용자의 role 정보를 조회합니다.
 */
public interface AdminUserRoleRepository {

    /**
     * AdminUser ID로 해당 사용자의 role code 목록 조회
     */
    List<String> findRoleCodesByAdminUserId(Long adminUserId);

    /**
     * AdminUser ID로 해당 사용자의 adminRoleId(Long) 목록 조회.
     * MenuRolePermission 조회 시 사용합니다.
     */
    List<Long> findRoleIdsByAdminUserId(Long adminUserId);

    /**
     * AdminUserID와 RoleID 매핑 정보를 저장합니다.
     */
    void saveAll(Long adminUserId, List<Long> adminRoleIds);
}
