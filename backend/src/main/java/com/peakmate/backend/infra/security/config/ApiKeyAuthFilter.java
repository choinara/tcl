package com.peakmate.backend.infra.security.config;

import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;
import java.util.Set;

/**
 * 엣지 서버(OPC-UA / Vision) 전용 API Key 인증 필터.
 * X-Api-Key 헤더를 검증한다. JWT 인증 필터보다 먼저 실행된다.
 */
@Component
@RequiredArgsConstructor
@Slf4j
public class ApiKeyAuthFilter extends OncePerRequestFilter {

    private static final String API_KEY_HEADER = "X-Api-Key";

    private static final Set<String> EDGE_PATHS = Set.of(
            "/api/opcua/ingest",
            "/api/vision/ingest",
            "/api/opcua/gateway/heartbeat"
    );

    private final EdgeServerProperties edgeServerProperties;

    @Override
    protected boolean shouldNotFilter(HttpServletRequest request) {
        return !EDGE_PATHS.contains(request.getRequestURI());
    }

    @Override
    protected void doFilterInternal(HttpServletRequest request,
                                    HttpServletResponse response,
                                    FilterChain filterChain) throws ServletException, IOException {
        String apiKey = request.getHeader(API_KEY_HEADER);

        if (apiKey == null || apiKey.isBlank()) {
            log.warn("Edge API key missing: {}", request.getRequestURI());
            writeUnauthorized(response, "Missing API key");
            return;
        }

        if (!edgeServerProperties.apiKey().equals(apiKey)) {
            log.warn("Edge API key invalid: {}", request.getRequestURI());
            writeUnauthorized(response, "Invalid API key");
            return;
        }

        filterChain.doFilter(request, response);
    }

    private void writeUnauthorized(HttpServletResponse response, String message) throws IOException {
        response.setStatus(HttpStatus.UNAUTHORIZED.value());
        response.setContentType(MediaType.APPLICATION_JSON_VALUE);
        response.getWriter().write("{\"error\":\"" + message + "\"}");
    }
}
