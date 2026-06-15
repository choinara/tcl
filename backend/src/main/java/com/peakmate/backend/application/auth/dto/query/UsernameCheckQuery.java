package com.peakmate.backend.application.auth.dto.query;

/**
 * 아이디 중복 확인 조회 Query DTO
 *
 * @param username 확인할 아이디
 */
public record UsernameCheckQuery(
    String username
) {
}
