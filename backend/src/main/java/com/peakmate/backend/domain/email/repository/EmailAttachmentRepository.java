package com.peakmate.backend.domain.email.repository;

import com.peakmate.backend.domain.email.entity.EmailAttachment;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface EmailAttachmentRepository extends JpaRepository<EmailAttachment, Long> {

    List<EmailAttachment> findByEmailMessageId(Long emailMessageId);
}
