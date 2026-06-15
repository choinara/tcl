package com.peakmate.backend.infra.security.util;

import com.peakmate.core.security.CookieUtil;
import com.peakmate.core.security.jwt.JwtTokenProvider;
import jakarta.servlet.http.HttpServletRequest;

public final class TokenExtractUtil {

    private TokenExtractUtil() {}

    /**
     * Authorization 헤더 → 쿠키 순서로 토큰을 추출한다.
     * cookieNames는 우선순위 순으로 전달한다.
     */
    public static String resolve(HttpServletRequest request, JwtTokenProvider tokenProvider, String... cookieNames) {
        String token = tokenProvider.resolveToken(request.getHeader("Authorization"));
        if (token != null) return token;
        for (String cookieName : cookieNames) {
            String value = CookieUtil.getCookieValue(request, cookieName);
            if (value != null) return value;
        }
        return null;
    }
}
