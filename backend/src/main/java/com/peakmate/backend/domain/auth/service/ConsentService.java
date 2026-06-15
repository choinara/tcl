package com.peakmate.backend.domain.auth.service;

import com.peakmate.backend.domain.auth.entity.ConsentHistory;
import com.peakmate.backend.domain.auth.repository.ConsentHistoryRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

/**
 * 개인정보 수집/이용 동의 관리 서비스.
 */
@Service
@RequiredArgsConstructor
public class ConsentService {

    private final ConsentHistoryRepository consentHistoryRepository;

    @Transactional
    public ConsentHistory recordConsent(Long userId, String consentType, String consentVersion,
                                         boolean consented, String ipAddress, String userAgent) {
        ConsentHistory history = ConsentHistory.create(
                userId, consentType, consentVersion, consented, ipAddress, userAgent);
        return consentHistoryRepository.save(history);
    }

    @Transactional(readOnly = true)
    public List<ConsentHistory> getUserConsentHistory(Long userId) {
        return consentHistoryRepository.findByUserIdOrderByConsentedAtDesc(userId);
    }

    @Transactional(readOnly = true)
    public boolean hasActiveConsent(Long userId, String consentType) {
        List<ConsentHistory> history = consentHistoryRepository
                .findByUserIdAndConsentTypeOrderByConsentedAtDesc(userId, consentType);
        return !history.isEmpty() && history.get(0).isConsented();
    }
}
