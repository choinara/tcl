package com.peakmate.backend.domain.admin.service;

import com.peakmate.backend.domain.admin.entity.AdminUser;
import com.peakmate.backend.domain.admin.entity.AdminUserStatus;
import com.peakmate.backend.domain.admin.repository.AdminUserRepository;
import com.peakmate.backend.domain.log.service.SystemLogService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;

/**
 * 휴면 계정 관리 스케줄러.
 * 90일 이상 미활동 계정을 자동 비활성화합니다.
 */
@Component
@RequiredArgsConstructor
@Slf4j
public class AccountMaintenanceScheduler {

    private final AdminUserRepository adminUserRepository;
    private final SystemLogService systemLogService;

    /**
     * 매일 02:00 - 휴면 계정 자동 비활성화
     */
    @Scheduled(cron = "0 0 2 * * *")
    @Transactional
    public void deactivateDormantAccounts() {
        try {
            LocalDateTime cutoff = LocalDateTime.now().minusDays(90);
            List<AdminUser> dormantUsers = adminUserRepository.findByStatusAndLastActivityAtBefore(
                    AdminUserStatus.ACTIVE, cutoff);

            if (dormantUsers.isEmpty()) {
                log.debug("No dormant accounts found");
                return;
            }

            int count = 0;
            for (AdminUser user : dormantUsers) {
                user.deactivate();
                count++;
                log.info("Deactivated dormant account: {} (last activity: {})",
                        user.getUsername(), user.getLastActivityAt());
            }

            adminUserRepository.saveAll(dormantUsers);

            systemLogService.log("DORMANT", null, "SYSTEM", "SCHEDULER",
                    "휴면 계정 자동 비활성화",
                    "%d건 처리".formatted(count));

            log.info("Deactivated {} dormant accounts", count);
        } catch (Exception e) {
            log.error("휴면계정 스케줄러 실행 중 오류 발생", e);
            try {
                systemLogService.log("SCHEDULER_ERROR", null, "SYSTEM", "SCHEDULER", "휴면계정 스케줄러 실패", e.getMessage());
            } catch (Exception logEx) {
                log.warn("[시스템 로그 기록 실패] SCHEDULER_ERROR", logEx);
            }
        }
    }
}
