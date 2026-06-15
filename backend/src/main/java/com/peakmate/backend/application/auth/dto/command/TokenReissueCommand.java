package com.peakmate.backend.application.auth.dto.command;

import java.util.Map;

/**
 * 토큰 재발급 Command DTO
 *
 * @param username 사용자명
 * @param claims JWT 클레임 정보
 * @param oldJti 기존 Access Token의 jti (세션 갱신 시 교체 대상)
 */
public record TokenReissueCommand(
    String username,
    Map<String, Object> claims,
    String oldJti
) {
}
