package com.peakmate.backend.domain.auth.repository;

import com.peakmate.backend.domain.auth.entity.ConsentHistory;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface ConsentHistoryRepository extends JpaRepository<ConsentHistory, Long> {

    List<ConsentHistory> findByUserIdOrderByConsentedAtDesc(Long userId);

    List<ConsentHistory> findByUserIdAndConsentTypeOrderByConsentedAtDesc(Long userId, String consentType);
}
