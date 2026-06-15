package com.peakmate.backend.infra.health;

import com.peakmate.backend.infra.repository.admin.AdminUserSessionJpaRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.boot.actuate.health.Health;
import org.springframework.boot.actuate.health.HealthIndicator;
import org.springframework.stereotype.Component;

/**
 * 세션 테이블 상태 모니터링.
 * 활성 세션 수를 /actuator/health에서 확인할 수 있다.
 */
@Component
@RequiredArgsConstructor
public class SessionHealthIndicator implements HealthIndicator {

    private final AdminUserSessionJpaRepository sessionRepository;

    @Override
    public Health health() {
        long activeSessions = sessionRepository.count();
        return Health.up()
                .withDetail("activeSessions", activeSessions)
                .build();
    }
}
