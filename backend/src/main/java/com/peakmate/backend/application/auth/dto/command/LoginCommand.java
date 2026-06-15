package com.peakmate.backend.application.auth.dto.command;

/**
 * Application 계층의 로그인 입력 DTO.
 */
public record LoginCommand(
        String username,
        String password) {
}
