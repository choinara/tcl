package com.peakmate.backend.domain.auth;

/**
 * 인증 결과로 반환되는 토큰 정보.
 * Domain 계층의 결과 객체입니다.
 */
public record AuthTokens(
        String accessToken,
        String refreshToken) {
}
