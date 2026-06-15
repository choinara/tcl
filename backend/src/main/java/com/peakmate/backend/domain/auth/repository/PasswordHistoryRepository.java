package com.peakmate.backend.domain.auth.repository;

import com.peakmate.backend.domain.auth.entity.PasswordHistory;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface PasswordHistoryRepository extends JpaRepository<PasswordHistory, Long> {

    /**
     * 최근 3개 비밀번호 이력 조회 (재사용 방지)
     */
    List<PasswordHistory> findTop3ByUserIdOrderByChangedAtDesc(Long userId);
}
