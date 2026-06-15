package com.peakmate.backend.domain.aps.entity;

import com.peakmate.core.audit.AuditableEntity;
import jakarta.persistence.*;
import lombok.AccessLevel;
import lombok.Getter;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.LocalDate;

/**
 * APS 호기별 가용능력 엔티티.
 * UNIQUE: (line_code, slot_date, shift)
 */
@Entity
@Table(name = "aps_capacity_slot",
        uniqueConstraints = @UniqueConstraint(columnNames = {"line_code", "slot_date", "shift"}))
@Getter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
public class ApsCapacitySlot extends AuditableEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "seq_id")
    private Long id;

    @Column(name = "line_code", length = 20, nullable = false)
    private String lineCode;

    @Column(name = "slot_date", nullable = false)
    private LocalDate slotDate;

    @Column(name = "shift", length = 20, nullable = false)
    private String shift;

    @Column(name = "crew", length = 20)
    private String crew;

    @Column(name = "worker_count", nullable = false)
    private Integer workerCount;

    @Column(name = "avail_hours", precision = 6, scale = 2, nullable = false)
    private BigDecimal availHours;

    @Column(name = "avail_weight_kg", precision = 12, scale = 3, nullable = false)
    private BigDecimal availWeightKg;

    @Column(name = "is_active", length = 1, nullable = false)
    private String isActive;

    public static ApsCapacitySlot create(String lineCode, LocalDate slotDate, String shift,
                                          String crew, Integer workerCount,
                                          BigDecimal availHours, BigDecimal availWeightKg) {
        ApsCapacitySlot slot = new ApsCapacitySlot();
        slot.lineCode = lineCode;
        slot.slotDate = slotDate;
        slot.shift = shift;
        slot.crew = crew;
        slot.workerCount = workerCount != null ? workerCount : 0;
        slot.availHours = availHours != null ? availHours : BigDecimal.ZERO;
        slot.availWeightKg = availWeightKg != null ? availWeightKg : BigDecimal.ZERO;
        slot.isActive = "Y";
        return slot;
    }

    public void update(String crew, Integer workerCount,
                       BigDecimal availHours, BigDecimal availWeightKg, String isActive) {
        this.crew = crew;
        this.workerCount = workerCount != null ? workerCount : this.workerCount;
        this.availHours = availHours != null ? availHours : this.availHours;
        this.availWeightKg = availWeightKg != null ? availWeightKg : this.availWeightKg;
        this.isActive = isActive != null ? isActive : this.isActive;
    }
}
