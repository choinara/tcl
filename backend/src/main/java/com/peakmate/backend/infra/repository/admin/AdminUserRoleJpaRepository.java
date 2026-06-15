package com.peakmate.backend.infra.repository.admin;

import com.peakmate.backend.domain.admin.entity.AdminUserRole;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;

public interface AdminUserRoleJpaRepository extends JpaRepository<AdminUserRole, Long> {
    List<AdminUserRole> findByAdminUserId(Long adminUserId);

    @Modifying(flushAutomatically = true, clearAutomatically = true)
    @Query("DELETE FROM AdminUserRole r WHERE r.adminUserId = :adminUserId")
    void deleteByAdminUserId(@Param("adminUserId") Long adminUserId);
}
