package com.peakmate.backend.domain.email.entity;

import com.peakmate.core.audit.AuditableEntity;
import jakarta.persistence.*;
import lombok.Getter;

@Getter
@Entity
@Table(name = "email_label_mapping")
public class EmailLabelMapping extends AuditableEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "account_id", nullable = false)
    private Long accountId;

    @Column(name = "gmail_label", length = 200, nullable = false)
    private String gmailLabel;

    @Column(name = "purpose_code", length = 50, nullable = false)
    private String purposeCode;

    @Column(name = "is_active", length = 1, nullable = false)
    private String isActive = "Y";

    protected EmailLabelMapping() {
    }

    public static EmailLabelMapping create(Long accountId, String gmailLabel,
                                            String purposeCode) {
        EmailLabelMapping e = new EmailLabelMapping();
        e.accountId = accountId;
        e.gmailLabel = gmailLabel;
        e.purposeCode = purposeCode;
        e.isActive = "Y";
        return e;
    }

    public void update(String gmailLabel, String purposeCode, String isActive) {
        this.gmailLabel = gmailLabel;
        this.purposeCode = purposeCode;
        this.isActive = isActive;
    }
}
