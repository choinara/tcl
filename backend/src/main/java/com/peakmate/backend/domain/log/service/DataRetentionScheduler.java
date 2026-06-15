package com.peakmate.backend.domain.log.service;

import com.peakmate.backend.domain.admin.entity.AdminUser;
import com.peakmate.backend.domain.admin.entity.AdminUserStatus;
import com.peakmate.backend.domain.admin.repository.AdminUserRepository;
import com.peakmate.backend.domain.auth.service.PiiAuditService;
import com.peakmate.core.config.SecurityProperties;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;

/**
 * 데이터 보존/파기 스케줄러.
 * 보존 기간이 만료된 로그 및 개인정보를 자동 삭제합니다.
 */
@Component
@RequiredArgsConstructor
@Slf4j
public class DataRetentionScheduler {

    private final JdbcTemplate jdbcTemplate;
    private final SystemLogService systemLogService;
    private final AdminUserRepository adminUserRepository;
    private final PiiAuditService piiAuditService;
    private final SecurityProperties securityProperties;

    /**
     * 매일 03:00 - 보존 기간 만료 데이터 자동 삭제
     */
    @Scheduled(cron = "0 0 3 * * *")
    @Transactional
    public void purgeExpiredData() {
        try {
            log.info("Data retention cleanup started");

            int systemLogRetentionDays = securityProperties.retention().systemLogDays();
            int loginAttemptRetentionDays = securityProperties.retention().loginAttemptDays();
            int auditLogRetentionDays = securityProperties.retention().auditLogDays();

            int systemLogCount = purgeOldRecords("system_log", "logged_at", systemLogRetentionDays);
            if (systemLogCount > 0) {
                log.info("Purged {} system log records older than {} days", systemLogCount, systemLogRetentionDays);
            }

            int loginAttemptCount = 0;
            try {
                loginAttemptCount = purgeOldRecords("login_attempts", "attempted_at", loginAttemptRetentionDays);
                if (loginAttemptCount > 0) {
                    log.info("Purged {} login attempt records older than {} days", loginAttemptCount, loginAttemptRetentionDays);
                }
            } catch (Exception e) {
                log.debug("login_attempts table not found, skipping: {}", e.getMessage());
            }

            try {
                int auditLogCount = purgeOldRecords("audit_log", "created_at", auditLogRetentionDays);
                if (auditLogCount > 0) {
                    log.info("Purged {} audit log records older than {} days", auditLogCount, auditLogRetentionDays);
                }
            } catch (Exception e) {
                log.debug("audit_log table not found, skipping: {}", e.getMessage());
            }

            if (systemLogCount > 0 || loginAttemptCount > 0) {
                systemLogService.log("RETENTION", null, "SYSTEM", "SCHEDULER",
                        "데이터 보존기간 만료 자동 삭제",
                        "시스템로그: %d건, 로그인시도: %d건".formatted(systemLogCount, loginAttemptCount));
            }

            // 비활성 사용자 개인정보 익명화 (1년 이상 비활성)
            int anonymizedCount = anonymizeInactiveUsers();
            if (anonymizedCount > 0) {
                int inactiveUserAnonymizeDays = securityProperties.retention().inactiveUserAnonymizeDays();
                log.info("Anonymized {} inactive user accounts older than {} days",
                        anonymizedCount, inactiveUserAnonymizeDays);
            }

            log.info("Data retention cleanup completed");
        } catch (Exception e) {
            log.error("데이터보존 스케줄러 실행 중 오류 발생", e);
            try {
                systemLogService.log("SCHEDULER_ERROR", null, "SYSTEM", "SCHEDULER", "데이터보존 스케줄러 실패", e.getMessage());
            } catch (Exception logEx) {
                log.warn("[시스템 로그 기록 실패] SCHEDULER_ERROR", logEx);
            }
        }
    }

    /**
     * 장기 비활성 사용자의 개인정보를 익명화합니다.
     * 비활성 상태로 전환된 후 지정 기간(기본 365일) 경과 시 PII를 삭제합니다.
     */
    private int anonymizeInactiveUsers() {
        int inactiveUserAnonymizeDays = securityProperties.retention().inactiveUserAnonymizeDays();
        LocalDateTime cutoff = LocalDateTime.now().minusDays(inactiveUserAnonymizeDays);
        List<AdminUser> targets = adminUserRepository.findByStatusAndLastActivityAtBefore(
                AdminUserStatus.INACTIVE, cutoff);

        int count = 0;
        for (AdminUser user : targets) {
            // 이미 익명화된 사용자 건너뛰기
            if (user.getName() != null && user.getName().startsWith("탈퇴사용자_")) {
                continue;
            }

            String originalUsername = user.getUsername();
            user.updateName("탈퇴사용자_" + user.getId());
            user.updateEmail("anonymized_" + user.getId() + "@deleted.local");

            // PII 감사 로그 기록
            piiAuditService.logAnonymize("admin_user", user.getId(), "SYSTEM");

            count++;
            log.info("Anonymized user: {} (inactive since: {})", originalUsername, user.getLastActivityAt());
        }

        if (count > 0) {
            adminUserRepository.saveAll(targets);
            systemLogService.log("RETENTION", null, "SYSTEM", "SCHEDULER",
                    "비활성 사용자 개인정보 익명화",
                    "%d건 처리".formatted(count));
        }

        return count;
    }

    private int purgeOldRecords(String tableName, String dateColumn, int retentionDays) {
        LocalDateTime cutoff = LocalDateTime.now().minusDays(retentionDays);
        String sql = "DELETE FROM %s WHERE %s < ?".formatted(tableName, dateColumn);
        return jdbcTemplate.update(sql, cutoff);
    }
}
