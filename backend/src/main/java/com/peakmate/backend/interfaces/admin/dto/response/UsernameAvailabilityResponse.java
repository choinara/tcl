package com.peakmate.backend.interfaces.admin.dto.response;

/**
 * 아이디 사용 가능 여부 응답 DTO.
 */
public record UsernameAvailabilityResponse(
        String username,
        boolean available,
        String message) {
}
