package com.peakmate.backend.application.auth.dto.result;

/**
 * 아이디 사용 가능 여부 결과 DTO.
 */
public record UsernameAvailabilityResult(
        String username,
        boolean available) {
}
