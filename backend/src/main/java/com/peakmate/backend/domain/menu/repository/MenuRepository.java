package com.peakmate.backend.domain.menu.repository;

import com.peakmate.backend.domain.menu.entity.MenuRolePermission;
import com.peakmate.backend.domain.menu.entity.SystemMenu;
import com.peakmate.backend.domain.menu.entity.UserPermission;

import java.util.List;
import java.util.Optional;

/**
 * 메뉴 Repository 인터페이스.
 * Domain 계층에서 정의하고, Infra 계층에서 구현합니다.
 */
public interface MenuRepository {

    /**
     * 모든 시스템 메뉴를 sortOrder 오름차순으로 조회합니다.
     * (useYn='Y'인 메뉴만)
     */
    List<SystemMenu> findAll();

    /**
     * useYn 상관없이 모든 메뉴를 sortOrder 오름차순으로 조회합니다.
     * 관리자 CRUD용.
     */
    List<SystemMenu> findAllMenus();

    /**
     * ID로 메뉴를 조회합니다.
     */
    Optional<SystemMenu> findById(Long id);

    /**
     * 메뉴를 저장합니다 (생성/수정).
     */
    SystemMenu save(SystemMenu menu);

    /**
     * 메뉴를 삭제합니다.
     */
    void deleteById(Long id);

    /**
     * 특정 부모 ID를 가진 자식 메뉴가 존재하는지 확인합니다.
     */
    boolean existsByParentId(Long parentId);

    /**
     * 주어진 역할 ID 목록에 해당하는 메뉴 권한 목록을 조회합니다.
     *
     * @param roleIds 역할 ID 목록
     * @return 해당 역할들의 메뉴 권한 목록
     */
    List<MenuRolePermission> findPermissionsByRoleIds(List<Long> roleIds);

    /**
     * 특정 사용자의 예외권한 목록을 조회합니다.
     *
     * @param adminUserId 사용자 ID
     * @return 사용자별 예외권한 목록
     */
    List<UserPermission> findUserPermissionsByUserId(Long adminUserId);

    /**
     * 사용자의 기존 예외권한을 모두 삭제합니다.
     */
    void deleteUserPermissionsByUserId(Long adminUserId);

    /**
     * 사용자 예외권한을 저장합니다.
     */
    UserPermission saveUserPermission(UserPermission userPermission);
}
