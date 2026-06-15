package com.peakmate.backend.domain.auth.service;

import com.peakmate.backend.domain.auth.entity.PasswordHistory;
import com.peakmate.backend.domain.auth.repository.PasswordHistoryRepository;
import com.peakmate.backend.global.error.PeakmateErrorCode;
import com.peakmate.core.error.BusinessException;
import lombok.RequiredArgsConstructor;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Set;
import java.util.regex.Pattern;

/**
 * 비밀번호 정책 서비스.
 * - 12자 이상, 대/소문자/숫자/특수문자 포함
 * - 일반적인 비밀번호 차단
 * - 연속 문자 4자 이상 차단
 * - 최근 3개 비밀번호 재사용 차단
 */
@Service
@RequiredArgsConstructor
public class PasswordPolicyService {

    private final PasswordHistoryRepository passwordHistoryRepository;
    private final PasswordEncoder passwordEncoder;

    private static final Pattern STRONG_PASSWORD = Pattern.compile(
            "^(?=.*[a-z])(?=.*[A-Z])(?=.*\\d)(?=.*[!@#$%^&*()_+\\-=\\[\\]{};':\"\\\\|,.<>/?`~])[\\S]{12,}$"
    );

    private static final Set<String> COMMON_PASSWORDS = Set.of(
            "password1234", "admin1234567", "qwerty123456",
            "p@ssw0rd1234", "welcome12345", "changeme1234",
            "letmein12345", "abc123456789", "password!234",
            "iloveyou1234", "sunshine1234", "princess1234",
            "football1234", "charlie12345", "shadow123456",
            "master123456", "dragon123456", "monkey1234567",
            "1234567890ab", "qwertyuiopas", "zxcvbnm12345",
            "trustno11234", "baseball1234", "michael12345",
            "password1!", "admin!@#$1234", "p@$$w0rd1234",
            "test12345678", "guest1234567", "root12345678",
            "toor12345678", "passw0rd1234", "pa$$word1234",
            "123456789abc", "abcdefgh1234", "1q2w3e4r5t6y",
            "qweasdzxc123"
    );

    /**
     * 비밀번호 강도 검증
     */
    public void validatePasswordStrength(String rawPassword) {
        if (!STRONG_PASSWORD.matcher(rawPassword).matches()) {
            throw new BusinessException(
                    "비밀번호는 12자 이상, 대문자/소문자/숫자/특수문자를 모두 포함해야 합니다.",
                    PeakmateErrorCode.PASSWORD_POLICY_VIOLATION);
        }

        if (COMMON_PASSWORDS.contains(rawPassword.toLowerCase())) {
            throw new BusinessException(
                    "너무 일반적인 비밀번호입니다. 다른 비밀번호를 사용하세요.",
                    PeakmateErrorCode.PASSWORD_POLICY_VIOLATION);
        }

        if (hasSequentialChars(rawPassword, 4)) {
            throw new BusinessException(
                    "연속된 문자/숫자 4자 이상을 포함할 수 없습니다.",
                    PeakmateErrorCode.PASSWORD_POLICY_VIOLATION);
        }
    }

    /**
     * 비밀번호 재사용 검증
     */
    public void validatePasswordReuse(Long userId, String rawPassword) {
        List<PasswordHistory> recentPasswords =
                passwordHistoryRepository.findTop3ByUserIdOrderByChangedAtDesc(userId);

        for (PasswordHistory history : recentPasswords) {
            if (passwordEncoder.matches(rawPassword, history.getPasswordHash())) {
                throw new BusinessException(
                        "최근 3회 이내 사용한 비밀번호는 재사용할 수 없습니다.",
                        PeakmateErrorCode.PASSWORD_POLICY_VIOLATION);
            }
        }
    }

    /**
     * 비밀번호 변경 이력 기록
     */
    @Transactional
    public void recordPasswordChange(Long userId, String encodedPassword) {
        passwordHistoryRepository.save(PasswordHistory.builder()
                .userId(userId)
                .passwordHash(encodedPassword)
                .changedAt(LocalDateTime.now())
                .build());
    }

    /**
     * 연속 문자 검출 (오름차순/내림차순)
     */
    private boolean hasSequentialChars(String password, int length) {
        if (password.length() < length) return false;

        for (int i = 0; i <= password.length() - length; i++) {
            boolean ascending = true;
            boolean descending = true;
            for (int j = 1; j < length; j++) {
                if (password.charAt(i + j) != password.charAt(i + j - 1) + 1) ascending = false;
                if (password.charAt(i + j) != password.charAt(i + j - 1) - 1) descending = false;
            }
            if (ascending || descending) return true;
        }
        return false;
    }
}
