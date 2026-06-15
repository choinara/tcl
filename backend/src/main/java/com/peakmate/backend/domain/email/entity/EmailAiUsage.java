package com.peakmate.backend.domain.email.entity;

import com.peakmate.core.audit.AuditableEntity;
import jakarta.persistence.*;
import lombok.Getter;

import java.math.BigDecimal;
import java.time.OffsetDateTime;

@Getter
@Entity
@Table(name = "email_ai_usage")
public class EmailAiUsage extends AuditableEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "email_message_id", nullable = false)
    private Long emailMessageId;

    @Column(name = "model_id", length = 100, nullable = false)
    private String modelId;

    @Column(name = "purpose", length = 50, nullable = false)
    private String purpose;

    @Column(name = "input_tokens", nullable = false)
    private Integer inputTokens;

    @Column(name = "output_tokens", nullable = false)
    private Integer outputTokens;

    @Column(name = "estimated_cost_usd", precision = 10, scale = 6, nullable = false)
    private BigDecimal estimatedCostUsd;

    @Column(name = "called_at", nullable = false)
    private OffsetDateTime calledAt;

    protected EmailAiUsage() {
    }

    public static EmailAiUsage create(Long emailMessageId, String modelId, String purpose,
                                       Integer inputTokens, Integer outputTokens,
                                       BigDecimal estimatedCostUsd, OffsetDateTime calledAt) {
        EmailAiUsage e = new EmailAiUsage();
        e.emailMessageId = emailMessageId;
        e.modelId = modelId;
        e.purpose = purpose;
        e.inputTokens = inputTokens;
        e.outputTokens = outputTokens;
        e.estimatedCostUsd = estimatedCostUsd;
        e.calledAt = calledAt;
        return e;
    }
}
