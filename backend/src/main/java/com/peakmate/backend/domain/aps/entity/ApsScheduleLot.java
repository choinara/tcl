package com.peakmate.backend.domain.aps.entity;

import com.peakmate.core.audit.AuditableEntity;
import jakarta.persistence.*;
import lombok.AccessLevel;
import lombok.Getter;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;

/**
 * APS 투입자재 LOT 엔티티.
 * schedule_draft_id로 ApsScheduleDraft를 논리적 참조 (FK 없음).
 */
@Entity
@Table(name = "aps_schedule_lot")
@Getter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
public class ApsScheduleLot extends AuditableEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "seq_id")
    private Long id;

    @Column(name = "schedule_draft_id", nullable = false)
    private Long scheduleDraftId;

    @Column(name = "input_lot_id", length = 50, nullable = false)
    private String inputLotId;

    @Column(name = "input_material_code", length = 30)
    private String inputMaterialCode;

    @Column(name = "input_qty", precision = 12, scale = 3, nullable = false)
    private BigDecimal inputQty;

    public static ApsScheduleLot create(Long scheduleDraftId, String inputLotId,
                                         String inputMaterialCode, BigDecimal inputQty) {
        ApsScheduleLot lot = new ApsScheduleLot();
        lot.scheduleDraftId = scheduleDraftId;
        lot.inputLotId = inputLotId;
        lot.inputMaterialCode = inputMaterialCode;
        lot.inputQty = inputQty != null ? inputQty : BigDecimal.ZERO;
        return lot;
    }
}
