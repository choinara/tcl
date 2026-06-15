package com.peakmate.backend.domain.admin.repository;

import com.peakmate.backend.domain.admin.entity.AdminUserSession;
import java.util.List;
import java.util.Optional;

/**
 * AdminUserSession 관리를 위한 도메인 레포지토리 인터페이스.
 */
public interface AdminUserSessionRepository {
    void save(AdminUserSession session);

    Optional<AdminUserSession> findByAdminUserId(Long adminUserId);

    List<AdminUserSession> findAllByAdminUserId(Long adminUserId);

    Optional<AdminUserSession> findByJti(String jti);

    void deleteByAdminUserId(Long adminUserId);

    void deleteByJti(String jti);
}
