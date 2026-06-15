package com.peakmate.backend.domain.aps.entity;

import com.peakmate.core.audit.AuditableEntity;
import jakarta.persistence.*;
import lombok.AccessLevel;
import lombok.Getter;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;

/**
 * APS 배정 결과 엔티티.
 * plan_id로 ApsPlan을 논리적 참조 (FK 없음).
 */
@Entity
@Table(name = "aps_schedule_draft")
@Getter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
public class ApsScheduleDraft extends AuditableEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "seq_id")
    private Long id;

    @Column(name = "plan_id", nullable = false)
    private Long planId;

    @Column(name = "line_code", length = 20, nullable = false)
    private String lineCode;

    @Column(name = "plan_date", nullable = false)
    private LocalDate planDate;

    @Column(name = "shift", length = 20, nullable = false)
    private String shift;

    @Column(name = "crew", length = 20)
    private String crew;

    @Column(name = "worker_count", nullable = false)
    private Integer workerCount;

    @Column(name = "product_code", length = 30, nullable = false)
    private String productCode;

    @Column(name = "planned_qty", precision = 12, scale = 3, nullable = false)
    private BigDecimal plannedQty;

    @Column(name = "takt_time", precision = 8, scale = 4)
    private BigDecimal taktTime;

    @Column(name = "start_time")
    private LocalDateTime startTime;

    @Column(name = "end_time")
    private LocalDateTime endTime;

    @Column(name = "sort_order", nullable = false)
    private Integer sortOrder;

    @Column(name = "remark", columnDefinition = "TEXT")
    private String remark;

    public static ApsScheduleDraft create(Long planId, String lineCode, LocalDate planDate,
                                           String shift, String crew, Integer workerCount,
                                           String productCode, BigDecimal plannedQty,
                                           BigDecimal taktTime, LocalDateTime startTime,
                                           LocalDateTime endTime, Integer sortOrder) {
        ApsScheduleDraft draft = new ApsScheduleDraft();
        draft.planId = planId;
        draft.lineCode = lineCode;
        draft.planDate = planDate;
        draft.shift = shift;
        draft.crew = crew;
        draft.workerCount = workerCount != null ? workerCount : 0;
        draft.productCode = productCode;
        draft.plannedQty = plannedQty != null ? plannedQty : BigDecimal.ZERO;
        draft.taktTime = taktTime;
        draft.startTime = startTime;
        draft.endTime = endTime;
        draft.sortOrder = sortOrder != null ? sortOrder : 0;
        return draft;
    }

    /**
     * 수동 조정 반영.
     */
    public void updateAdjustment(BigDecimal plannedQty, String lineCode, String shift,
                                  String crew, Integer workerCount, String remark) {
        if (plannedQty != null) this.plannedQty = plannedQty;
        if (lineCode != null) this.lineCode = lineCode;
        if (shift != null) this.shift = shift;
        if (crew != null) this.crew = crew;
        if (workerCount != null) this.workerCount = workerCount;
        if (remark != null) this.remark = remark;
    }
}
