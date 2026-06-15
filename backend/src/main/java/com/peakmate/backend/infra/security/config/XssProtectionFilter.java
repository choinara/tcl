package com.peakmate.backend.infra.security.config;

import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletRequestWrapper;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.core.Ordered;
import org.springframework.core.annotation.Order;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;
import java.util.regex.Pattern;

/**
 * XSS 방어 필터.
 * 요청 파라미터와 헤더에서 XSS 위험 패턴을 제거합니다.
 */
@Component
@Order(Ordered.HIGHEST_PRECEDENCE + 1)
public class XssProtectionFilter extends OncePerRequestFilter {

    private static final Pattern[] XSS_PATTERNS = {
        Pattern.compile("<script>(.*?)</script>", Pattern.CASE_INSENSITIVE),
        Pattern.compile("javascript:", Pattern.CASE_INSENSITIVE),
        Pattern.compile("vbscript:", Pattern.CASE_INSENSITIVE),
        Pattern.compile("on\\w+\\s*=", Pattern.CASE_INSENSITIVE),
        Pattern.compile("<iframe", Pattern.CASE_INSENSITIVE),
        Pattern.compile("<object", Pattern.CASE_INSENSITIVE),
        Pattern.compile("<embed", Pattern.CASE_INSENSITIVE),
        Pattern.compile("<form", Pattern.CASE_INSENSITIVE),
    };

    @Override
    protected void doFilterInternal(HttpServletRequest request,
                                    HttpServletResponse response,
                                    FilterChain filterChain) throws ServletException, IOException {
        XssRequestWrapper wrappedRequest = new XssRequestWrapper(request);
        filterChain.doFilter(wrappedRequest, response);
    }

    public static String sanitize(String value) {
        if (value == null) return null;
        String cleaned = value;
        for (Pattern pattern : XSS_PATTERNS) {
            cleaned = pattern.matcher(cleaned).replaceAll("");
        }
        cleaned = cleaned.replace("<", "&lt;").replace(">", "&gt;");
        return cleaned;
    }

    static class XssRequestWrapper extends HttpServletRequestWrapper {

        public XssRequestWrapper(HttpServletRequest request) {
            super(request);
        }

        @Override
        public String getParameter(String name) {
            String value = super.getParameter(name);
            return sanitizeParam(value);
        }

        @Override
        public String[] getParameterValues(String name) {
            String[] values = super.getParameterValues(name);
            if (values == null) return null;
            String[] sanitized = new String[values.length];
            for (int i = 0; i < values.length; i++) {
                sanitized[i] = sanitizeParam(values[i]);
            }
            return sanitized;
        }

        @Override
        public String getHeader(String name) {
            String value = super.getHeader(name);
            if ("Authorization".equalsIgnoreCase(name)) return value;
            return sanitizeParam(value);
        }

        private String sanitizeParam(String value) {
            if (value == null) return null;
            String cleaned = value;
            for (Pattern pattern : XSS_PATTERNS) {
                cleaned = pattern.matcher(cleaned).replaceAll("");
            }
            return cleaned;
        }
    }
}
