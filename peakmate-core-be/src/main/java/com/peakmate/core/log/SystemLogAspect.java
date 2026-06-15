package com.peakmate.core.log;

import jakarta.servlet.http.HttpServletRequest;
import lombok.extern.slf4j.Slf4j;
import org.aspectj.lang.ProceedingJoinPoint;
import org.aspectj.lang.annotation.Around;
import org.aspectj.lang.annotation.Aspect;
import org.aspectj.lang.reflect.MethodSignature;
import org.springframework.core.DefaultParameterNameDiscoverer;
import org.springframework.core.ParameterNameDiscoverer;
import org.springframework.expression.EvaluationContext;
import org.springframework.expression.ExpressionParser;
import org.springframework.expression.spel.standard.SpelExpressionParser;
import org.springframework.expression.spel.support.StandardEvaluationContext;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.context.request.RequestContextHolder;
import org.springframework.web.context.request.ServletRequestAttributes;

/**
 * @SystemLog 어노테이션 처리 AOP Aspect (추상 클래스).
 * 메서드 성공 후 시스템 로그를 기록한다. 실패 시 로그를 남기지 않는다.
 * 프로젝트별로 doLog(), extractUserId()를 구현하여 사용한다.
 */
@Aspect
@Slf4j
public abstract class SystemLogAspect {

    private final ExpressionParser parser = new SpelExpressionParser();
    private final ParameterNameDiscoverer parameterNameDiscoverer = new DefaultParameterNameDiscoverer();

    @Around("@annotation(systemLog)")
    public Object around(ProceedingJoinPoint joinPoint, SystemLog systemLog) throws Throwable {
        // 메서드 실행 (성공 시에만 이후 로그 기록)
        Object result = joinPoint.proceed();

        try {
            String username = extractUsername();
            Long userId = extractUserId(username);
            String ipAddress = extractIpAddress();
            String detail = resolveDetail(systemLog, joinPoint);

            doLog(systemLog.type(), userId, username, ipAddress, systemLog.action(), detail);
        } catch (Exception e) {
            log.warn("[시스템 로그 기록 실패] {}", systemLog.type(), e);
        }

        return result;
    }

    /**
     * 시스템 로그를 기록한다. 프로젝트별 SystemLogService를 호출.
     */
    protected abstract void doLog(String logType, Long userId, String username,
                                   String ipAddress, String action, String detail);

    /**
     * username으로 userId를 조회한다. 프로젝트별 UserRepository를 호출.
     */
    protected abstract Long extractUserId(String username);

    private String extractUsername() {
        try {
            Authentication auth = SecurityContextHolder.getContext().getAuthentication();
            if (auth == null || !auth.isAuthenticated() || "anonymousUser".equals(auth.getPrincipal())) {
                return "unknown";
            }
            Object principal = auth.getPrincipal();
            if (principal instanceof UserDetails userDetails) {
                return userDetails.getUsername();
            }
            return auth.getName();
        } catch (Exception e) {
            return "unknown";
        }
    }

    private String extractIpAddress() {
        try {
            ServletRequestAttributes attrs =
                    (ServletRequestAttributes) RequestContextHolder.getRequestAttributes();
            if (attrs != null) {
                HttpServletRequest request = attrs.getRequest();
                String forwarded = request.getHeader("X-Forwarded-For");
                if (forwarded != null && !forwarded.isBlank()) {
                    return forwarded.split(",")[0].trim();
                }
                return request.getRemoteAddr();
            }
        } catch (Exception e) {
            // RequestContext 없는 환경 (테스트 등) — IP 없음
        }
        return null;
    }

    private String resolveDetail(SystemLog systemLog, ProceedingJoinPoint joinPoint) {
        String detailExpr = systemLog.detail();
        if (detailExpr == null || detailExpr.isBlank()) {
            return systemLog.action();
        }
        try {
            MethodSignature signature = (MethodSignature) joinPoint.getSignature();
            String[] paramNames = parameterNameDiscoverer.getParameterNames(signature.getMethod());
            Object[] args = joinPoint.getArgs();

            EvaluationContext context = new StandardEvaluationContext();
            if (paramNames != null) {
                for (int i = 0; i < paramNames.length; i++) {
                    context.setVariable(paramNames[i], args[i]);
                }
            }
            Object value = parser.parseExpression(detailExpr).getValue(context);
            return value != null ? value.toString() : systemLog.action();
        } catch (Exception e) {
            // SpEL 파싱 실패 — 빈 문자열 대신 action 반환, 앱 크래시 방지
            log.debug("SpEL detail 해석 실패: {}", detailExpr, e);
            return systemLog.action();
        }
    }
}
