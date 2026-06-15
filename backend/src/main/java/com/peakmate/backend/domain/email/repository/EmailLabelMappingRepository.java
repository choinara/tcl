package com.peakmate.backend.domain.email.repository;

import com.peakmate.backend.domain.email.entity.EmailLabelMapping;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface EmailLabelMappingRepository extends JpaRepository<EmailLabelMapping, Long> {

    List<EmailLabelMapping> findByAccountId(Long accountId);

    Optional<EmailLabelMapping> findByAccountIdAndGmailLabel(Long accountId, String gmailLabel);
}
