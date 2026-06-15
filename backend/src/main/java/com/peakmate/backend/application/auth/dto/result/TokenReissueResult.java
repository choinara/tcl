package com.peakmate.backend.application.auth.dto.result;

import lombok.Builder;

/**
 * 토큰 재발행 결과를 담는 Result DTO.
 * Access Token과 Refresh Token 모두 포함합니다.
 */
@Builder
public record TokenReissueResult(
        String accessToken,
        String refreshToken) {
}
