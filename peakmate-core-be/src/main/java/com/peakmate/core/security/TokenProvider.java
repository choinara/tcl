package com.peakmate.core.security;

import java.util.Map;

/**
 * 토큰 생성/검증을 위한 인터페이스.
 * 실제 구현은 JwtTokenProvider에서 수행합니다.
 */
public interface TokenProvider {

    String createAccessToken(String username, Map<String, Object> claims);

    String createRefreshToken(String username);

    java.time.LocalDateTime getExpiration(String token);

    Map<String, Object> getClaimsMap(String token);

    String getUsername(String token);

    String getJti(String token);

    String resolveToken(String authorizationHeader);
}
