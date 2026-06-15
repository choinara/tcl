package com.peakmate.backend.interfaces.admin.dto.response;

/**
 * 회원가입 응답 DTO.
 */
public record SignupResponse(
        Long id,
        String username) {
}
