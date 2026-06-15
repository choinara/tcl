package com.peakmate.backend.infra.repository.menu;

import com.peakmate.backend.domain.menu.entity.MenuRolePermission;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;

/**
 * MenuRolePermission Spring Data JPA Repository.
 * 복잡한 조회는 MenuRepositoryImpl(QueryDSL)에서 처리합니다.
 */
public interface MenuRolePermissionJpaRepository extends JpaRepository<MenuRolePermission, Long> {
    List<MenuRolePermission> findByAdminRoleId(Long adminRoleId);

    @Modifying(flushAutomatically = true, clearAutomatically = true)
    @Query("DELETE FROM MenuRolePermission p WHERE p.adminRoleId = :adminRoleId")
    void deleteByAdminRoleId(@Param("adminRoleId") Long adminRoleId);

    @Modifying(flushAutomatically = true, clearAutomatically = true)
    @Query("DELETE FROM MenuRolePermission p WHERE p.menuId = :menuId")
    void deleteByMenuId(@Param("menuId") Long menuId);
}
