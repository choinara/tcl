package com.peakmate.backend.domain.log.repository;

import com.peakmate.backend.domain.log.entity.LoginAttempt;
import org.springframework.data.jpa.repository.JpaRepository;

public interface LoginAttemptRepository extends JpaRepository<LoginAttempt, Long> {
}
