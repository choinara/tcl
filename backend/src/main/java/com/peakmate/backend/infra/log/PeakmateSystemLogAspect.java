package com.peakmate.backend.infra.log;

import com.peakmate.backend.domain.admin.entity.AdminUser;
import com.peakmate.backend.domain.admin.repository.AdminUserRepository;
import com.peakmate.backend.domain.log.service.SystemLogService;
import com.peakmate.core.log.SystemLogAspect;
import lombok.RequiredArgsConstructor;
import org.aspectj.lang.annotation.Aspect;
import org.springframework.stereotype.Component;

/**
 * PeakMate 전용 @SystemLog AOP 구현체.
 * core-be의 SystemLogAspect를 상속하여 SystemLogService/AdminUserRepository를 주입.
 */
@Aspect
@Component
@RequiredArgsConstructor
public class PeakmateSystemLogAspect extends SystemLogAspect {

    private final SystemLogService systemLogService;
    private final AdminUserRepository adminUserRepository;

    @Override
    protected void doLog(String logType, Long userId, String username,
                          String ipAddress, String action, String detail) {
        systemLogService.log(logType, userId, username, ipAddress, action, detail);
    }

    @Override
    protected Long extractUserId(String username) {
        if ("unknown".equals(username)) return null;
        return adminUserRepository.findByUsername(username)
                .map(AdminUser::getId)
                .orElse(null);
    }
}
