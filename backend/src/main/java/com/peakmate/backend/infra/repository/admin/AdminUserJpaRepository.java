package com.peakmate.backend.infra.repository.admin;

import com.peakmate.backend.domain.admin.entity.AdminUser;
import com.peakmate.backend.domain.admin.entity.AdminUserStatus;
import org.springframework.data.jpa.repository.JpaRepository;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

public interface AdminUserJpaRepository extends JpaRepository<AdminUser, Long> {
    Optional<AdminUser> findByUsername(String username);
    List<AdminUser> findByStatus(AdminUserStatus status);
    List<AdminUser> findByStatusAndLastActivityAtBefore(AdminUserStatus status, LocalDateTime cutoff);
    List<AdminUser> findByTeamId(Long teamId);
    List<AdminUser> findByNameContainingOrUsernameContaining(String name, String username);
}
