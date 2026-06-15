package com.peakmate.backend.interfaces.auth.dto.response;

import com.peakmate.backend.application.auth.dto.result.TokenReissueResult;

/**
 * Interface 계층의 토큰 재발급 응답 DTO.
 * Application 계층의 TokenReissueResult로부터 변환됩니다.
 */
public record TokenRefreshResponse(
        String accessToken,
        String refreshToken) {

    /**
     * TokenReissueResult로부터 TokenRefreshResponse 생성
     */
    public static TokenRefreshResponse from(TokenReissueResult result) {
        return new TokenRefreshResponse(result.accessToken(), result.refreshToken());
    }
}
