package com.peakmate.backend.domain.auth;

/**
 * 비밀번호 암호화를 위한 도메인 인터페이스.
 * Domain 계층에서 정의하고, Infra 계층에서 구현합니다.
 */
public interface PasswordEncoder {

    /**
     * 비밀번호 암호화
     */
    String encode(String rawPassword);
}
