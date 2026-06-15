package com.peakmate.backend.application.auth.dto.command;

/**
 * Refresh Token 재발급 Command DTO
 *
 * @param username 사용자명
 */
public record RefreshTokenReissueCommand(
    String username
) {
}
