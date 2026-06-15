package com.peakmate.backend.global.filter;

import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.core.Ordered;
import org.springframework.core.annotation.Order;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;

/**
 * HTTP 요청 응답시간 로깅 필터.
 * - 모든 API 요청의 처리시간을 로깅합니다.
 * - 임계값(기본 3초) 초과 시 WARN 레벨로 슬로우 쿼리 경고를 출력합니다.
 * - 응답 헤더에 X-Response-Time(ms)을 추가합니다.
 */
@Component
@Order(Ordered.HIGHEST_PRECEDENCE + 1)
@Slf4j
public class RequestTimingFilter extends OncePerRequestFilter {

    @Value("${performance.slow-request-threshold-ms:3000}")
    private long slowRequestThresholdMs;

    @Override
    protected void doFilterInternal(HttpServletRequest request,
                                    HttpServletResponse response,
                                    FilterChain filterChain) throws ServletException, IOException {
        // 정적 리소스 스킵
        String uri = request.getRequestURI();
        if (isStaticResource(uri)) {
            filterChain.doFilter(request, response);
            return;
        }

        long startTime = System.currentTimeMillis();

        try {
            filterChain.doFilter(request, response);
        } finally {
            long duration = System.currentTimeMillis() - startTime;
            String method = request.getMethod();
            int status = response.getStatus();

            // 응답 헤더에 처리시간 추가
            response.setHeader("X-Response-Time", duration + "ms");

            if (duration >= slowRequestThresholdMs) {
                log.warn("SLOW REQUEST: {} {} → {} ({}ms) [threshold={}ms]",
                        method, uri, status, duration, slowRequestThresholdMs);
            } else if (log.isDebugEnabled()) {
                log.debug("REQUEST: {} {} → {} ({}ms)", method, uri, status, duration);
            }

            // INFO 레벨에서는 API 요청만 간결 로깅
            if (uri.startsWith("/api/") && log.isInfoEnabled() && duration < slowRequestThresholdMs) {
                log.info("{} {} → {} ({}ms)", method, uri, status, duration);
            }
        }
    }

    private boolean isStaticResource(String uri) {
        return uri.startsWith("/assets/") ||
               uri.endsWith(".js") ||
               uri.endsWith(".css") ||
               uri.endsWith(".png") ||
               uri.endsWith(".svg") ||
               uri.endsWith(".ico") ||
               uri.endsWith(".woff") ||
               uri.endsWith(".woff2") ||
               uri.equals("/") ||
               uri.equals("/index.html") ||
               uri.equals("/favicon.ico");
    }
}
