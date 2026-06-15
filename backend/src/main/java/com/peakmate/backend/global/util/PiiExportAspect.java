package com.peakmate.backend.global.util;

import com.peakmate.backend.domain.auth.service.PiiAuditService;
import com.peakmate.core.security.annotation.PiiExportGuard;
import jakarta.servlet.http.HttpServletRequest;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.aspectj.lang.ProceedingJoinPoint;
import org.aspectj.lang.annotation.Around;
import org.aspectj.lang.annotation.Aspect;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Component;
import org.springframework.web.context.request.RequestContextHolder;
import org.springframework.web.context.request.ServletRequestAttributes;

/**
 * PiiExportGuard 어노테이션 AOP 처리.
 * 엑셀 내보내기 시 PII 감사 로그를 자동 기록합니다.
 */
@Aspect
@Component
@RequiredArgsConstructor
@Slf4j
public class PiiExportAspect {

    private final PiiAuditService piiAuditService;

    @Around("@annotation(guard)")
    public Object aroundExport(ProceedingJoinPoint joinPoint, PiiExportGuard guard) throws Throwable {
        String username = "UNKNOWN";
        String ipAddress = null;

        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        if (auth != null) {
            username = auth.getName();
        }

        ServletRequestAttributes attrs = (ServletRequestAttributes) RequestContextHolder.getRequestAttributes();
        if (attrs != null) {
            HttpServletRequest request = attrs.getRequest();
            ipAddress = request.getRemoteAddr();
        }

        // PII 내보내기 감사 로그 기록
        piiAuditService.logExport(guard.targetTable(), username, ipAddress, guard.description());
        log.info("PII export audit: user={}, table={}, desc={}", username, guard.targetTable(), guard.description());

        return joinPoint.proceed();
    }
}
