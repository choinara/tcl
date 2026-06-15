package com.peakmate.backend.domain.document.entity;

import com.peakmate.core.audit.AuditableEntity;
import jakarta.persistence.*;
import lombok.AccessLevel;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import org.hibernate.annotations.ColumnDefault;

import java.time.LocalDate;

@Getter
@Entity
@Table(name = "dms_document")
@NoArgsConstructor(access = AccessLevel.PROTECTED)
public class DmsDocument extends AuditableEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "seq_id", nullable = false)
    private Long id;

    @Column(name = "doc_number", length = 50)
    private String docNumber;

    @Column(name = "title", nullable = false, length = 200)
    private String title;

    @Column(name = "category", nullable = false, length = 30)
    private String category;

    @Column(name = "description", columnDefinition = "TEXT")
    private String description;

    @Column(name = "product_id")
    private Long productId;

    @Column(name = "equipment_id")
    private Long equipmentId;

    @Column(name = "department_id")
    private Long departmentId;

    // 인증서 전용
    @Column(name = "issuer", length = 200)
    private String issuer;

    @Column(name = "valid_from")
    private LocalDate validFrom;

    @Column(name = "valid_until")
    private LocalDate validUntil;

    // 양식(FORM) 전용
    @Column(name = "is_template")
    private Boolean isTemplate;

    @Column(name = "period_type", length = 20)
    private String periodType;

    @Column(name = "due_day")
    private Integer dueDay;

    @Column(name = "assignee_id")
    private Long assigneeId;

    // 공통
    @Column(name = "version", length = 20)
    private String version;

    @Column(name = "status", length = 20)
    private String status;

    @Column(name = "tags", length = 500)
    private String tags;

    @ColumnDefault("'Y'")
    @Column(name = "is_active", nullable = false, length = 1, columnDefinition = "CHAR(1)")
    private String isActive;

    @Builder
    private DmsDocument(String docNumber, String title, String category, String description,
                        Long productId, Long equipmentId, Long departmentId,
                        String issuer, LocalDate validFrom, LocalDate validUntil,
                        Boolean isTemplate, String periodType, Integer dueDay, Long assigneeId,
                        String version, String status, String tags,
                        String isActive) {
        this.docNumber = docNumber;
        this.title = title;
        this.category = category;
        this.description = description;
        this.productId = productId;
        this.equipmentId = equipmentId;
        this.departmentId = departmentId;
        this.issuer = issuer;
        this.validFrom = validFrom;
        this.validUntil = validUntil;
        this.isTemplate = isTemplate;
        this.periodType = periodType;
        this.dueDay = dueDay;
        this.assigneeId = assigneeId;
        this.version = version;
        this.status = status;
        this.tags = tags;
        this.isActive = isActive;
    }

    public static DmsDocument create(String docNumber, String title, String category, String description,
                                      Long productId, Long equipmentId, Long departmentId,
                                      String issuer, LocalDate validFrom, LocalDate validUntil,
                                      Boolean isTemplate, String periodType, Integer dueDay, Long assigneeId,
                                      String version, String status, String tags) {
        return DmsDocument.builder()
                .docNumber(docNumber)
                .title(title)
                .category(category)
                .description(description)
                .productId(productId)
                .equipmentId(equipmentId)
                .departmentId(departmentId)
                .issuer(issuer)
                .validFrom(validFrom)
                .validUntil(validUntil)
                .isTemplate(isTemplate != null ? isTemplate : false)
                .periodType(periodType)
                .dueDay(dueDay)
                .assigneeId(assigneeId)
                .version(version != null ? version : "1.0")
                .status(status != null ? status : "ACTIVE")
                .tags(tags)
                .isActive("Y")
                .build();
    }

    public void update(String docNumber, String title, String description,
                       Long productId, Long equipmentId, Long departmentId,
                       String issuer, LocalDate validFrom, LocalDate validUntil,
                       Boolean isTemplate, String periodType, Integer dueDay, Long assigneeId,
                       String version, String status, String tags) {
        this.docNumber = docNumber;
        this.title = title;
        this.description = description;
        this.productId = productId;
        this.equipmentId = equipmentId;
        this.departmentId = departmentId;
        this.issuer = issuer;
        this.validFrom = validFrom;
        this.validUntil = validUntil;
        this.isTemplate = isTemplate;
        this.periodType = periodType;
        this.dueDay = dueDay;
        this.assigneeId = assigneeId;
        this.version = version;
        this.status = status;
        this.tags = tags;
    }

    public void deactivate() {
        this.isActive = "N";
    }
}
