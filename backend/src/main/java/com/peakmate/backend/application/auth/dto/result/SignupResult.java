package com.peakmate.backend.application.auth.dto.result;

/**
 * 회원가입 결과를 담는 DTO.
 */
public record SignupResult(
        Long id,
        String username) {
}
