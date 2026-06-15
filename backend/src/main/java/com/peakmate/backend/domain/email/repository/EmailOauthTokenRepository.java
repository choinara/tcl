package com.peakmate.backend.domain.email.repository;

import com.peakmate.backend.domain.email.entity.EmailOauthToken;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface EmailOauthTokenRepository extends JpaRepository<EmailOauthToken, Long> {

    Optional<EmailOauthToken> findByAccountId(Long accountId);

    List<EmailOauthToken> findByIsActive(String isActive);
}
