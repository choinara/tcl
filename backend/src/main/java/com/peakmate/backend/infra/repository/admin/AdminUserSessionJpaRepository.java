package com.peakmate.backend.infra.repository.admin;

import com.peakmate.backend.domain.admin.entity.AdminUserSession;
import org.springframework.data.jpa.repository.JpaRepository;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

public interface AdminUserSessionJpaRepository extends JpaRepository<AdminUserSession, Long> {

    List<AdminUserSession> findAllByAdminUserId(Long adminUserId);

    Optional<AdminUserSession> findByJti(String jti);

    void deleteAllByAdminUserId(Long adminUserId);

    void deleteByJti(String jti);

    void deleteByAccessTokenExpiresAtBefore(LocalDateTime dateTime);
}
