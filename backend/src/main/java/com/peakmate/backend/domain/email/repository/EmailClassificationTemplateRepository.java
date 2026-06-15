package com.peakmate.backend.domain.email.repository;

import com.peakmate.backend.domain.email.entity.EmailClassificationTemplate;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface EmailClassificationTemplateRepository extends JpaRepository<EmailClassificationTemplate, Long> {

    Optional<EmailClassificationTemplate> findByPurposeCode(String purposeCode);
}
