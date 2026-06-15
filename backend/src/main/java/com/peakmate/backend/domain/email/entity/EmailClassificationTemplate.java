package com.peakmate.backend.domain.email.entity;

import com.peakmate.core.audit.AuditableEntity;
import jakarta.persistence.*;
import lombok.Getter;

@Getter
@Entity
@Table(name = "email_classification_template")
public class EmailClassificationTemplate extends AuditableEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "purpose_code", length = 50, nullable = false, unique = true)
    private String purposeCode;

    @Column(name = "purpose_name", length = 200, nullable = false)
    private String purposeName;

    @Column(name = "target_table", length = 100)
    private String targetTable;

    @Column(name = "field_mapping", columnDefinition = "JSONB", nullable = false)
    private String fieldMapping;

    @Column(name = "is_active", length = 1, nullable = false)
    private String isActive = "Y";

    @Column(name = "sort_order", nullable = false)
    private Integer sortOrder = 0;

    protected EmailClassificationTemplate() {
    }

    public static EmailClassificationTemplate create(String purposeCode, String purposeName,
                                                      String targetTable, String fieldMapping,
                                                      Integer sortOrder) {
        EmailClassificationTemplate e = new EmailClassificationTemplate();
        e.purposeCode = purposeCode;
        e.purposeName = purposeName;
        e.targetTable = targetTable;
        e.fieldMapping = fieldMapping;
        e.isActive = "Y";
        e.sortOrder = sortOrder != null ? sortOrder : 0;
        return e;
    }

    public void update(String purposeName, String targetTable, String fieldMapping,
                       String isActive, Integer sortOrder) {
        this.purposeName = purposeName;
        this.targetTable = targetTable;
        this.fieldMapping = fieldMapping;
        this.isActive = isActive;
        this.sortOrder = sortOrder != null ? sortOrder : 0;
    }
}
