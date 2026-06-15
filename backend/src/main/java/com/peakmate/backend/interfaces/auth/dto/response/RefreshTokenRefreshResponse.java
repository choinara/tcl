package com.peakmate.backend.interfaces.auth.dto.response;

/**
 * Refresh Token 재발급 응답 DTO.
 */
public record RefreshTokenRefreshResponse(
        String refreshToken
) {
}
