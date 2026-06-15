package com.peakmate.backend.infra.security.config;

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
 * HTTPS 강제 리다이렉트 필터.
 * 운영 환경에서 HTTP 요청을 HTTPS로 자동 리다이렉트합니다.
 * 로컬 개발 환경에서는 비활성화됩니다.
 */
@Component
@Order(Ordered.HIGHEST_PRECEDENCE + 2)
@Slf4j
public class HttpsRedirectFilter extends OncePerRequestFilter {

    @Value("${security.https.redirect-enabled:false}")
    private boolean redirectEnabled;

    @Override
    protected void doFilterInternal(HttpServletRequest request,
                                    HttpServletResponse response,
                                    FilterChain filterChain) throws ServletException, IOException {
        if (!redirectEnabled) {
            filterChain.doFilter(request, response);
            return;
        }

        // 프록시/로드밸런서 뒤에서 X-Forwarded-Proto 헤더로 원본 프로토콜 확인
        String scheme = request.getHeader("X-Forwarded-Proto");
        if (scheme == null) {
            scheme = request.getScheme();
        }

        if ("http".equalsIgnoreCase(scheme)) {
            String redirectUrl = "https://" + request.getServerName() + request.getRequestURI();
            String queryString = request.getQueryString();
            if (queryString != null) {
                redirectUrl += "?" + queryString;
            }
            response.setStatus(HttpServletResponse.SC_MOVED_PERMANENTLY);
            response.setHeader("Location", redirectUrl);
            return;
        }

        filterChain.doFilter(request, response);
    }
}
