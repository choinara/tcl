package com.peakmate.backend.infra.security.password;

import com.peakmate.backend.domain.auth.PasswordMatcher;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.context.annotation.Primary;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;

/**
 * 비밀번호 검증 구현체.
 * DelegatingPasswordEncoder를 통해 PBKDF2/BCrypt 모두 지원.
 * BCrypt 전용 비밀번호는 마이그레이션 필요로 판별.
 */
@Component
@Primary
@RequiredArgsConstructor
@Slf4j
public class MigrationPasswordMatcher implements PasswordMatcher {

    private final PasswordEncoder passwordEncoder;

    @Override
    public boolean matches(String rawPassword, String encodedPassword) {
        if (encodedPassword == null || encodedPassword.isEmpty()) {
            return false;
        }
        return passwordEncoder.matches(rawPassword, encodedPassword);
    }

    @Override
    public boolean needsMigration(String encodedPassword) {
        // {pbkdf2} 접두사가 없으면 레거시(BCrypt) → 마이그레이션 필요
        return encodedPassword != null && !encodedPassword.startsWith("{pbkdf2}");
    }
}
