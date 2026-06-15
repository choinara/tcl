package com.peakmate.backend.domain.admin.service;

import com.peakmate.backend.domain.admin.repository.AdminUserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

/**
 * 사용자 활동 추적 비동기 서비스.
 * HTTP 요청 스레드와 분리하여 last_activity_at DB 쓰기 지연을 제거한다.
 */
@Service
@RequiredArgsConstructor
public class AdminUserActivityService {

    private final AdminUserRepository adminUserRepository;

    @Async
    @Transactional
    public void updateLastActivityAsync(Long userId) {
        adminUserRepository.findById(userId).ifPresent(user -> {
            user.updateLastActivity();
            adminUserRepository.save(user);
        });
    }
}
