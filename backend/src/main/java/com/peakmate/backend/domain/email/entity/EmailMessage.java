package com.peakmate.backend.domain.email.entity;

import com.peakmate.core.audit.AuditableEntity;
import jakarta.persistence.*;
import lombok.Getter;

import java.math.BigDecimal;
import java.time.OffsetDateTime;

@Getter
@Entity
@Table(name = "email_message")
public class EmailMessage extends AuditableEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "gmail_message_id", length = 64, nullable = false)
    private String gmailMessageId;

    @Column(name = "gmail_thread_id", length = 64)
    private String gmailThreadId;

    @Column(name = "account_id", nullable = false)
    private Long accountId;

    @Column(name = "subject", length = 998)
    private String subject;

    @Column(name = "sender_email", length = 320)
    private String senderEmail;

    @Column(name = "sender_name", length = 200)
    private String senderName;

    @Column(name = "recipient", length = 2000)
    private String recipient;

    @Column(name = "cc", length = 2000)
    private String cc;

    @Column(name = "received_at", nullable = false)
    private OffsetDateTime receivedAt;

    @Column(name = "label", length = 200)
    private String label;

    @Column(name = "body_text", columnDefinition = "TEXT")
    private String bodyText;

    @Column(name = "body_html", columnDefinition = "TEXT")
    private String bodyHtml;

    @Column(name = "size_bytes")
    private Long sizeBytes;

    @Column(name = "processing_status", length = 30, nullable = false)
    private String processingStatus = "PENDING";

    @Column(name = "customer_code", length = 50)
    private String customerCode;

    @Column(name = "customer_name", length = 200)
    private String customerName;

    @Column(name = "partner_code", length = 50)
    private String partnerCode;

    @Column(name = "partner_name", length = 200)
    private String partnerName;

    @Column(name = "assignee_user_id")
    private Long assigneeUserId;

    @Column(name = "classification_purpose", length = 50)
    private String classificationPurpose;

    @Column(name = "classification_confidence", precision = 4, scale = 3)
    private BigDecimal classificationConfidence;

    @Column(name = "ai_processed_at")
    private OffsetDateTime aiProcessedAt;

    @Column(name = "approved_at")
    private OffsetDateTime approvedAt;

    @Column(name = "approved_by", length = 100)
    private String approvedBy;

    @Column(name = "rejected_by", length = 100)
    private String rejectedBy;

    @Column(name = "rejected_at")
    private OffsetDateTime rejectedAt;

    @Column(name = "reject_reason", length = 500)
    private String rejectReason;

    @Column(name = "retention_until", nullable = false)
    private OffsetDateTime retentionUntil;

    protected EmailMessage() {
    }

    public static EmailMessage create(String gmailMessageId, String gmailThreadId, Long accountId,
                                       String subject, String senderEmail, String senderName,
                                       String recipient, String cc, OffsetDateTime receivedAt,
                                       String label, String bodyText, String bodyHtml,
                                       Long sizeBytes, OffsetDateTime retentionUntil) {
        EmailMessage e = new EmailMessage();
        e.gmailMessageId = gmailMessageId;
        e.gmailThreadId = gmailThreadId;
        e.accountId = accountId;
        e.subject = subject;
        e.senderEmail = senderEmail;
        e.senderName = senderName;
        e.recipient = recipient;
        e.cc = cc;
        e.receivedAt = receivedAt;
        e.label = label;
        e.bodyText = bodyText;
        e.bodyHtml = bodyHtml;
        e.sizeBytes = sizeBytes;
        e.processingStatus = "PENDING";
        e.retentionUntil = retentionUntil;
        return e;
    }

    /**
     * AI 분류 완료 처리.
     * aiProcessedAt은 AI 분류 행위의 비즈니스 타임스탬프이며,
     * AuditableEntity의 자동 관리 대상(@CreatedDate/@LastModifiedDate)과 다르다.
     * 따라서 OffsetDateTime.now() 수동 호출이 적절하다. (Rule 8-1 예외)
     */
    public void markClassified(String purpose, BigDecimal confidence, String customerCode,
                                String customerName, String partnerCode, String partnerName,
                                Long assigneeUserId) {
        this.processingStatus = "CLASSIFIED";
        this.classificationPurpose = purpose;
        this.classificationConfidence = confidence;
        this.customerCode = customerCode;
        this.customerName = customerName;
        this.partnerCode = partnerCode;
        this.partnerName = partnerName;
        this.assigneeUserId = assigneeUserId;
        this.aiProcessedAt = OffsetDateTime.now();
    }

    /**
     * 신뢰도 미달 또는 미매핑 라벨 -- 미배정 큐로 이동.
     * aiProcessedAt은 비즈니스 타임스탬프 (Rule 8-1 예외).
     */
    public void markUnassigned(String purpose, BigDecimal confidence) {
        this.processingStatus = "UNASSIGNED";
        this.classificationPurpose = purpose;
        this.classificationConfidence = confidence;
        this.aiProcessedAt = OffsetDateTime.now();
    }

    /**
     * 승인 처리.
     * approvedAt은 승인 행위의 비즈니스 타임스탬프 (Rule 8-1 예외).
     */
    public void markApproved(String approvedByUsername) {
        if (!"CLASSIFIED".equals(this.processingStatus) && !"UNASSIGNED".equals(this.processingStatus)) {
            throw new IllegalStateException("CLASSIFIED 또는 UNASSIGNED 상태만 승인할 수 있습니다");
        }
        this.processingStatus = "APPROVED";
        this.approvedBy = approvedByUsername;
        this.approvedAt = OffsetDateTime.now();
    }

    /**
     * 거절 처리.
     * rejectedBy/rejectedAt은 거절 행위의 비즈니스 타임스탬프이며,
     * AuditableEntity의 자동 관리 대상(@CreatedDate/@LastModifiedDate)과 다르다.
     * 따라서 OffsetDateTime.now() 수동 호출이 적절하다. (Rule 8-1 예외)
     */
    public void markRejected(String rejectedByUsername, String reason) {
        if (!"CLASSIFIED".equals(this.processingStatus) && !"UNASSIGNED".equals(this.processingStatus)) {
            throw new IllegalStateException("CLASSIFIED 또는 UNASSIGNED 상태만 거절할 수 있습니다");
        }
        this.processingStatus = "REJECTED";
        this.rejectedBy = rejectedByUsername;
        this.rejectedAt = OffsetDateTime.now();
        this.rejectReason = reason;
    }

    /**
     * 담당자 재배정.
     * 어떤 처리상태에서도 재배정 가능하나, REJECTED 상태는 재배정 무의미하므로 차단.
     * status 자동 전환은 본 G1 범위 외 -- G4 컨트롤러 구현 시 정책 결정.
     */
    public void reassign(Long newAssigneeUserId) {
        if ("REJECTED".equals(this.processingStatus)) {
            throw new IllegalStateException("거절된 메시지는 재배정할 수 없습니다");
        }
        if (newAssigneeUserId == null) {
            throw new IllegalArgumentException("재배정 대상 사용자 ID는 필수입니다");
        }
        this.assigneeUserId = newAssigneeUserId;
    }
}
