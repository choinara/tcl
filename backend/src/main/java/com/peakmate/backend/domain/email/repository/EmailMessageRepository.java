package com.peakmate.backend.domain.email.repository;

import com.peakmate.backend.domain.email.entity.EmailMessage;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.Optional;

public interface EmailMessageRepository extends JpaRepository<EmailMessage, Long> {

    Optional<EmailMessage> findByGmailMessageIdAndAccountId(String gmailMessageId, Long accountId);

    boolean existsByGmailMessageIdAndAccountId(String gmailMessageId, Long accountId);

    List<EmailMessage> findByProcessingStatusOrderByReceivedAtAsc(String processingStatus);

    Page<EmailMessage> findAllByOrderByReceivedAtDesc(Pageable pageable);

    Page<EmailMessage> findByProcessingStatusOrderByReceivedAtDesc(String processingStatus, Pageable pageable);

    Page<EmailMessage> findByClassificationPurposeOrderByReceivedAtDesc(String classificationPurpose, Pageable pageable);

    @Query("SELECT m FROM EmailMessage m WHERE " +
           "(:status IS NULL OR m.processingStatus = :status) AND " +
           "(:purpose IS NULL OR m.classificationPurpose = :purpose) AND " +
           "(:kw IS NULL OR LOWER(m.subject) LIKE :kw OR LOWER(m.senderEmail) LIKE :kw OR LOWER(m.senderName) LIKE :kw) " +
           "ORDER BY m.receivedAt DESC")
    Page<EmailMessage> findByFilters(
            @Param("status") String status,
            @Param("purpose") String purpose,
            @Param("kw") String kw,
            Pageable pageable);
}
