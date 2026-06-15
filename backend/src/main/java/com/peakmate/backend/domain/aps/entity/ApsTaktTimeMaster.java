package com.peakmate.backend.domain.aps.entity;

import com.peakmate.core.audit.AuditableEntity;
import jakarta.persistence.*;
import lombok.AccessLevel;
import lombok.Getter;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;

/**
 * APS Takt time 마스터 엔티티.
 * UNIQUE: (line_code, product_code)
 */
@Entity
@Table(name = "aps_takt_time_master",
        uniqueConstraints = @UniqueConstraint(columnNames = {"line_code", "product_code"}))
@Getter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
public class ApsTaktTimeMaster extends AuditableEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "seq_id")
    private Long id;

    @Column(name = "line_code", length = 20, nullable = false)
    private String lineCode;

    @Column(name = "product_code", length = 30, nullable = false)
    private String productCode;

    @Column(name = "takt_time_min_per_kg", precision = 8, scale = 4, nullable = false)
    private BigDecimal taktTimeMinPerKg;

    @Column(name = "min_worker_count", nullable = false)
    private Integer minWorkerCount;

    @Column(name = "is_active", length = 1, nullable = false)
    private String isActive;

    public static ApsTaktTimeMaster create(String lineCode, String productCode,
                                            BigDecimal taktTimeMinPerKg, Integer minWorkerCount) {
        ApsTaktTimeMaster master = new ApsTaktTimeMaster();
        master.lineCode = lineCode;
        master.productCode = productCode;
        master.taktTimeMinPerKg = taktTimeMinPerKg;
        master.minWorkerCount = minWorkerCount != null ? minWorkerCount : 1;
        master.isActive = "Y";
        return master;
    }

    public void update(BigDecimal taktTimeMinPerKg, Integer minWorkerCount, String isActive) {
        this.taktTimeMinPerKg = taktTimeMinPerKg != null ? taktTimeMinPerKg : this.taktTimeMinPerKg;
        this.minWorkerCount = minWorkerCount != null ? minWorkerCount : this.minWorkerCount;
        this.isActive = isActive != null ? isActive : this.isActive;
    }
}
