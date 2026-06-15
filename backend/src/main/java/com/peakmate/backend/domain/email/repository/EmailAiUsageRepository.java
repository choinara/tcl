package com.peakmate.backend.domain.email.repository;

import com.peakmate.backend.domain.email.entity.EmailAiUsage;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface EmailAiUsageRepository extends JpaRepository<EmailAiUsage, Long> {

    List<EmailAiUsage> findByEmailMessageId(Long emailMessageId);
}
