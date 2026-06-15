package com.peakmate.backend.infra.repository.menu;

import com.peakmate.backend.domain.menu.entity.UserPermission;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.Optional;

/**
 * UserPermission Spring Data JPA Repository.
 */
public interface UserPermissionJpaRepository extends JpaRepository<UserPermission, Long> {

    List<UserPermission> findByAdminUserId(Long adminUserId);

    Optional<UserPermission> findByAdminUserIdAndMenuId(Long adminUserId, Long menuId);

    @Modifying(flushAutomatically = true, clearAutomatically = true)
    @Query("DELETE FROM UserPermission p WHERE p.adminUserId = :adminUserId")
    void deleteByAdminUserId(@Param("adminUserId") Long adminUserId);
}
