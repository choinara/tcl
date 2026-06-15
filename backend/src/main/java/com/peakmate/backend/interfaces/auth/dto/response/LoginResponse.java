package com.peakmate.backend.interfaces.auth.dto.response;

import com.peakmate.backend.application.auth.dto.result.LoginResult;

/**
 * Interface 계층의 로그인 응답 DTO.
 * Application 계층의 LoginResult로부터 변환됩니다.
 */
public record LoginResponse(
        String accessToken,
        String refreshToken,
        boolean mfaRequired) {
    /**
     * LoginResult로부터 LoginResponse 생성
     */
    public static LoginResponse from(LoginResult result) {
        return new LoginResponse(result.accessToken(), result.refreshToken(), result.mfaRequired());
    }
}
