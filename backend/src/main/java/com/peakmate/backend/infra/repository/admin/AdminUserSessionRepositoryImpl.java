package com.peakmate.backend.infra.repository.admin;

import com.peakmate.backend.domain.admin.entity.AdminUserSession;
import com.peakmate.backend.domain.admin.repository.AdminUserSessionRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
@RequiredArgsConstructor
public class AdminUserSessionRepositoryImpl implements AdminUserSessionRepository {

    private final AdminUserSessionJpaRepository adminUserSessionJpaRepository;

    @Override
    public void save(AdminUserSession session) {
        if (session != null) {
            adminUserSessionJpaRepository.save(session);
        }
    }

    @Override
    public Optional<AdminUserSession> findByAdminUserId(Long adminUserId) {
        if (adminUserId == null) {
            return Optional.empty();
        }
        // 1인 1세션 정책 (UNIQUE 제약)이므로 첫 번째 결과 반환
        return adminUserSessionJpaRepository.findAllByAdminUserId(adminUserId)
                .stream()
                .reduce((a, b) -> a.getUpdatedAt().isAfter(b.getUpdatedAt()) ? a : b);
    }

    @Override
    public List<AdminUserSession> findAllByAdminUserId(Long adminUserId) {
        if (adminUserId == null) {
            return List.of();
        }
        return adminUserSessionJpaRepository.findAllByAdminUserId(adminUserId);
    }

    @Override
    public Optional<AdminUserSession> findByJti(String jti) {
        if (jti == null) {
            return Optional.empty();
        }
        return adminUserSessionJpaRepository.findByJti(jti);
    }

    @Override
    public void deleteByAdminUserId(Long adminUserId) {
        if (adminUserId != null) {
            adminUserSessionJpaRepository.deleteAllByAdminUserId(adminUserId);
            adminUserSessionJpaRepository.flush();
        }
    }

    @Override
    public void deleteByJti(String jti) {
        if (jti != null) {
            adminUserSessionJpaRepository.deleteByJti(jti);
        }
    }
}
