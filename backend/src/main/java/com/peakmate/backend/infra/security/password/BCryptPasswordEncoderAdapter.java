package com.peakmate.backend.infra.security.password;

import com.peakmate.backend.domain.auth.PasswordEncoder;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Component;

/**
 * Spring Security PasswordEncoder를 사용하는 도메인 PasswordEncoder 구현체.
 * DelegatingPasswordEncoder (PBKDF2 primary + BCrypt fallback) 사용.
 */
@Component
@RequiredArgsConstructor
public class BCryptPasswordEncoderAdapter implements PasswordEncoder {

    private final org.springframework.security.crypto.password.PasswordEncoder passwordEncoder;

    @Override
    public String encode(String rawPassword) {
        return passwordEncoder.encode(rawPassword);
    }
}
