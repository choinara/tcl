package com.peakmate.backend.infra.security.config;

import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.core.Ordered;
import org.springframework.core.annotation.Order;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.atomic.AtomicInteger;
import java.util.concurrent.atomic.AtomicLong;

/**
 * IP 기반 API Rate Limiting 필터.
 * 슬라이딩 윈도우 방식으로 분당 요청 수를 제한합니다.
 */
@Component
@Order(Ordered.HIGHEST_PRECEDENCE)
@Slf4j
public class RateLimitingFilter extends OncePerRequestFilter {

    @Value("${security.rate-limit.requests-per-minute:120}")
    private int requestsPerMinute;

    @Value("${security.rate-limit.login-per-minute:10}")
    private int loginPerMinute;

    @Value("${security.rate-limit.api-write-per-minute:60}")
    private int apiWritePerMinute;

    @Value("${security.rate-limit.enabled:true}")
    private boolean enabled;

    private final Map<String, RateBucket> buckets = new ConcurrentHashMap<>();
    private final Map<String, RateBucket> loginBuckets = new ConcurrentHashMap<>();
    private final Map<String, RateBucket> writeBuckets = new ConcurrentHashMap<>();

    @Override
    protected void doFilterInternal(HttpServletRequest request,
                                    HttpServletResponse response,
                                    FilterChain filterChain) throws ServletException, IOException {
        if (!enabled) {
            filterChain.doFilter(request, response);
            return;
        }

        String clientIp = getClientIp(request);
        String uri = request.getRequestURI();
        String method = request.getMethod();

        // 엔드포인트별 차별화된 Rate Limit
        int limit;
        Map<String, RateBucket> targetBuckets;

        if (uri.startsWith("/api/auth/login")) {
            // 로그인 시도: 분당 10회 (Brute Force 방어)
            limit = loginPerMinute;
            targetBuckets = loginBuckets;
        } else if ("POST".equals(method) || "PUT".equals(method) || "DELETE".equals(method) || "PATCH".equals(method)) {
            // 쓰기 요청: 분당 60회
            limit = apiWritePerMinute;
            targetBuckets = writeBuckets;
        } else {
            // 일반 읽기 요청: 분당 120회
            limit = requestsPerMinute;
            targetBuckets = buckets;
        }

        RateBucket bucket = targetBuckets.computeIfAbsent(clientIp, k -> new RateBucket());

        if (!bucket.tryConsume(limit)) {
            log.warn("Rate limit exceeded for IP: {}, URI: {}, limit: {}", clientIp, uri, limit);
            response.setStatus(HttpStatus.TOO_MANY_REQUESTS.value());
            response.setContentType("application/json;charset=UTF-8");
            response.getWriter().write(
                    "{\"success\":false,\"message\":\"요청이 너무 많습니다. 잠시 후 다시 시도해주세요.\",\"status\":429}");
            return;
        }

        response.setHeader("X-RateLimit-Limit", String.valueOf(limit));
        response.setHeader("X-RateLimit-Remaining", String.valueOf(bucket.getRemaining(limit)));

        filterChain.doFilter(request, response);
    }

    private String getClientIp(HttpServletRequest request) {
        String xff = request.getHeader("X-Forwarded-For");
        if (xff != null && !xff.isBlank()) {
            return xff.split(",")[0].trim();
        }
        return request.getRemoteAddr();
    }

    static class RateBucket {
        private final AtomicInteger count = new AtomicInteger(0);
        private final AtomicLong windowStart = new AtomicLong(System.currentTimeMillis());
        private static final long WINDOW_MS = 60_000L;

        boolean tryConsume(int limit) {
            long now = System.currentTimeMillis();
            if (now - windowStart.get() > WINDOW_MS) {
                count.set(0);
                windowStart.set(now);
            }
            return count.incrementAndGet() <= limit;
        }

        int getRemaining(int limit) {
            long now = System.currentTimeMillis();
            if (now - windowStart.get() > WINDOW_MS) {
                return limit;
            }
            return Math.max(0, limit - count.get());
        }
    }
}
