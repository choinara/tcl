package com.peakmate.backend.application.auth.dto.result;

/**
 * Application 계층의 로그인 결과 DTO.
 * Interface 계층의 LoginResponse로 변환됩니다.
 */
public record LoginResult(
        String accessToken,
        String refreshToken,
        boolean mfaRequired) {

    public LoginResult(String accessToken, String refreshToken) {
        this(accessToken, refreshToken, false);
    }

    public static LoginResult ofMfaRequired() {
        return new LoginResult(null, null, true);
    }
}
