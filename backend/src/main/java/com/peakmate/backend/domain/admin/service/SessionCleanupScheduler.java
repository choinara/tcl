package com.peakmate.backend.domain.admin.service;

import com.peakmate.backend.infra.repository.admin.AdminUserSessionJpaRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;

/**
 * 만료 세션 정리 스케줄러.
 * 매일 04:00에 accessTokenExpiresAt이 경과한 세션을 DB에서 삭제하여 테이블 비대화를 방지한다.
 * accessTokenExpiresAt 컬럼은 jti 전환(8단계) 후에도 유지됨 (V58에서 변경 대상 아님).
 */
@Component
@RequiredArgsConstructor
@Slf4j
public class SessionCleanupScheduler {

    private final AdminUserSessionJpaRepository sessionRepository;

    @Scheduled(cron = "0 0 4 * * *")
    @Transactional
    public void cleanupExpiredSessions() {
        LocalDateTime now = LocalDateTime.now();
        sessionRepository.deleteByAccessTokenExpiresAtBefore(now);
        log.info("[세션 정리] 만료 세션 삭제 완료 (기준: {})", now);
    }
}
