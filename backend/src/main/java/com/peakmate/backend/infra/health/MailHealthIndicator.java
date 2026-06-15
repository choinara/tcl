package com.peakmate.backend.infra.health;

import com.peakmate.backend.infra.mail.MailService;
import lombok.RequiredArgsConstructor;
import org.springframework.boot.actuate.health.Health;
import org.springframework.boot.actuate.health.HealthIndicator;
import org.springframework.stereotype.Component;

import java.util.Map;

/**
 * DB 기반 메일 설정을 사용하는 커스텀 HealthIndicator.
 * 시스템 설정 UI에서 관리하는 SMTP 설정으로 연결을 확인한다.
 * Spring 기본 MailHealthIndicator는 비활성화됨 (management.health.mail.enabled: false).
 */
@Component
@RequiredArgsConstructor
public class MailHealthIndicator implements HealthIndicator {

    private final MailService mailService;

    @Override
    public Health health() {
        if (!mailService.isEnabled()) {
            return Health.up()
                    .withDetail("status", "disabled")
                    .withDetail("message", "메일 기능이 비활성화 상태입니다 (시스템 설정에서 활성화 필요)")
                    .build();
        }

        Map<String, String> settings = mailService.getSettings();
        boolean connected = mailService.testConnection();

        if (connected) {
            return Health.up()
                    .withDetail("host", settings.get("host"))
                    .withDetail("port", settings.get("port"))
                    .build();
        } else {
            return Health.down()
                    .withDetail("host", settings.get("host"))
                    .withDetail("port", settings.get("port"))
                    .withDetail("message", "SMTP 연결 실패 — 시스템 설정에서 메일 서버 정보를 확인하세요")
                    .build();
        }
    }
}
