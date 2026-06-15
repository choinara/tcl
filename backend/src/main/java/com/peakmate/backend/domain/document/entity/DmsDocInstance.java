package com.peakmate.backend.domain.document.entity;

import com.peakmate.core.audit.AuditableEntity;
import jakarta.persistence.*;
import lombok.AccessLevel;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import org.hibernate.annotations.ColumnDefault;

import java.time.LocalDate;
import java.time.LocalDateTime;

@Getter
@Entity
@Table(name = "dms_doc_instance")
@NoArgsConstructor(access = AccessLevel.PROTECTED)
public class DmsDocInstance extends AuditableEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "seq_id", nullable = false)
    private Long id;

    @Column(name = "template_id", nullable = false)
    private Long templateId;

    @Column(name = "period_label", nullable = false, length = 30)
    private String periodLabel;

    @Column(name = "status", length = 20)
    private String status;

    @Column(name = "due_date")
    private LocalDate dueDate;

    @Column(name = "completed_at")
    private LocalDateTime completedAt;

    @Column(name = "approved_at")
    private LocalDateTime approvedAt;

    @Column(name = "assignee_id")
    private Long assigneeId;

    @Column(name = "approver_id")
    private Long approverId;

    @Column(name = "remark", columnDefinition = "TEXT")
    private String remark;

    @ColumnDefault("'Y'")
    @Column(name = "is_active", nullable = false, length = 1, columnDefinition = "CHAR(1)")
    private String isActive;

    @Builder
    private DmsDocInstance(Long templateId, String periodLabel, String status,
                           LocalDate dueDate, LocalDateTime completedAt, LocalDateTime approvedAt,
                           Long assigneeId, Long approverId, String remark,
                           String isActive) {
        this.templateId = templateId;
        this.periodLabel = periodLabel;
        this.status = status;
        this.dueDate = dueDate;
        this.completedAt = completedAt;
        this.approvedAt = approvedAt;
        this.assigneeId = assigneeId;
        this.approverId = approverId;
        this.remark = remark;
        this.isActive = isActive;
    }

    public static DmsDocInstance create(Long templateId, String periodLabel, String status,
                                         LocalDate dueDate, Long assigneeId, Long approverId,
                                         String remark) {
        return DmsDocInstance.builder()
                .templateId(templateId)
                .periodLabel(periodLabel)
                .status(status != null ? status : "NOT_STARTED")
                .dueDate(dueDate)
                .assigneeId(assigneeId)
                .approverId(approverId)
                .remark(remark)
                .isActive("Y")
                .build();
    }

    public void update(String status, LocalDate dueDate, Long assigneeId,
                       Long approverId, String remark) {
        if (status != null) {
            this.status = status;
            if ("COMPLETED".equals(status)) {
                this.completedAt = LocalDateTime.now();
            } else if ("APPROVED".equals(status)) {
                this.approvedAt = LocalDateTime.now();
            }
        }
        if (dueDate != null) this.dueDate = dueDate;
        if (assigneeId != null) this.assigneeId = assigneeId;
        if (approverId != null) this.approverId = approverId;
        if (remark != null) this.remark = remark;
    }

    public void deactivate() {
        this.isActive = "N";
    }
}
