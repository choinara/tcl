package com.peakmate.backend.domain.aps.entity;

import com.peakmate.core.audit.AuditableEntity;
import jakarta.persistence.*;
import lombok.AccessLevel;
import lombok.Getter;
import lombok.NoArgsConstructor;

import java.time.LocalDate;

/**
 * APS 계획 마스터 엔티티.
 * DRAFT -> CONFIRMED -> CANCELLED / REVISED 상태 전이.
 * @Version 낙관 락으로 동시 commit 방어.
 */
@Entity
@Table(name = "aps_plan")
@Getter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
public class ApsPlan extends AuditableEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "seq_id")
    private Long id;

    @Column(name = "period_start", nullable = false)
    private LocalDate periodStart;

    @Column(name = "period_end", nullable = false)
    private LocalDate periodEnd;

    @Column(name = "line_codes", length = 500, nullable = false)
    private String lineCodes;

    @Column(name = "status", length = 20, nullable = false)
    private String status;

    @Version
    @Column(name = "version", nullable = false)
    private Long version;

    @Column(name = "remark", columnDefinition = "TEXT")
    private String remark;

    /**
     * 신규 계획 생성 팩토리 메서드.
     */
    public static ApsPlan create(LocalDate periodStart, LocalDate periodEnd, String lineCodes) {
        ApsPlan plan = new ApsPlan();
        plan.periodStart = periodStart;
        plan.periodEnd = periodEnd;
        plan.lineCodes = lineCodes;
        plan.status = "DRAFT";
        return plan;
    }

    /**
     * 계획 확정 (DRAFT -> CONFIRMED).
     */
    public void confirm() {
        if (!"DRAFT".equals(this.status)) {
            throw new IllegalStateException("DRAFT 상태의 계획만 확정할 수 있습니다. 현재 상태: " + this.status);
        }
        this.status = "CONFIRMED";
    }

    /**
     * 계획 취소 (CONFIRMED -> CANCELLED).
     */
    public void cancel() {
        if (!"CONFIRMED".equals(this.status)) {
            throw new IllegalStateException("CONFIRMED 상태의 계획만 취소할 수 있습니다. 현재 상태: " + this.status);
        }
        this.status = "CANCELLED";
    }

    /**
     * 계획 수정 — 원본을 REVISED로 전환.
     * 신규 DRAFT 계획은 별도로 create()해야 한다.
     */
    public void revise() {
        if (!"CONFIRMED".equals(this.status)) {
            throw new IllegalStateException("CONFIRMED 상태의 계획만 수정할 수 있습니다. 현재 상태: " + this.status);
        }
        this.status = "REVISED";
    }
}
