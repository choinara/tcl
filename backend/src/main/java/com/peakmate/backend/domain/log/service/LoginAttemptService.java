package com.peakmate.backend.domain.log.service;

import com.peakmate.backend.domain.log.entity.LoginAttempt;
import com.peakmate.backend.domain.log.repository.LoginAttemptRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;

/**
 * 로그인 시도 기록 서비스.
 */
@Service
@RequiredArgsConstructor
public class LoginAttemptService {

    private final LoginAttemptRepository loginAttemptRepository;

    @Transactional
    public void recordSuccess(String username, String ipAddress, String userAgent) {
        loginAttemptRepository.save(LoginAttempt.builder()
                .username(username)
                .success(true)
                .ipAddress(ipAddress)
                .userAgent(userAgent)
                .attemptedAt(LocalDateTime.now())
                .build());
    }

    @Transactional
    public void recordFailure(String username, String ipAddress, String userAgent, String reason) {
        loginAttemptRepository.save(LoginAttempt.builder()
                .username(username)
                .success(false)
                .ipAddress(ipAddress)
                .userAgent(userAgent)
                .reason(reason)
                .attemptedAt(LocalDateTime.now())
                .build());
    }
}
