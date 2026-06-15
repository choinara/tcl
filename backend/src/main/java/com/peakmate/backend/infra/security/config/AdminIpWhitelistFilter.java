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
import java.util.Arrays;
import java.util.List;

/**
 * 관리자 API IP 화이트리스트 필터.
 * 시스템 관리 API(/api/system/**)에 대해 허용된 IP만 접근을 허용합니다.
 * 비활성화 시(기본) 모든 IP에서 접근 가능합니다.
 */
@Component
@Order(Ordered.HIGHEST_PRECEDENCE + 3)
@Slf4j
public class AdminIpWhitelistFilter extends OncePerRequestFilter {

    @Value("${security.admin-ip-whitelist.enabled:false}")
    private boolean enabled;

    @Value("${security.admin-ip-whitelist.allowed-ips:}")
    private String allowedIpsConfig;

    @Override
    protected void doFilterInternal(HttpServletRequest request,
                                    HttpServletResponse response,
                                    FilterChain filterChain) throws ServletException, IOException {
        if (!enabled) {
            filterChain.doFilter(request, response);
            return;
        }

        String requestUri = request.getRequestURI();
        if (!requestUri.startsWith("/api/system/")) {
            filterChain.doFilter(request, response);
            return;
        }

        String clientIp = getClientIp(request);
        List<String> allowedIps = parseAllowedIps();

        if (allowedIps.isEmpty() || allowedIps.contains(clientIp)) {
            filterChain.doFilter(request, response);
            return;
        }

        log.warn("Admin IP whitelist blocked: IP={}, URI={}", clientIp, requestUri);
        response.setStatus(HttpStatus.FORBIDDEN.value());
        response.setContentType("application/json;charset=UTF-8");
        response.getWriter().write(
                "{\"success\":false,\"message\":\"허용되지 않은 IP에서의 접근입니다.\",\"status\":403}");
    }

    private String getClientIp(HttpServletRequest request) {
        String xff = request.getHeader("X-Forwarded-For");
        if (xff != null && !xff.isBlank()) {
            return xff.split(",")[0].trim();
        }
        return request.getRemoteAddr();
    }

    private List<String> parseAllowedIps() {
        if (allowedIpsConfig == null || allowedIpsConfig.isBlank()) {
            return List.of();
        }
        return Arrays.stream(allowedIpsConfig.split(","))
                .map(String::trim)
                .filter(ip -> !ip.isEmpty())
                .toList();
    }
}
