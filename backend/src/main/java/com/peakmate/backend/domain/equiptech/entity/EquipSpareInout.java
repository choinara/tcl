package com.peakmate.backend.domain.equiptech.entity;

import com.peakmate.core.audit.AuditableEntity;
import jakarta.persistence.*;
import lombok.Getter;

import java.math.BigDecimal;
import java.time.LocalDate;

@Getter
@Entity
@Table(name = "equip_spare_inout")
public class EquipSpareInout extends AuditableEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "seq_id")
    private Long id;

    @Column(name = "spare_id", nullable = false)
    private Long spareId;

    @Column(name = "inout_type", length = 10, nullable = false)
    private String inoutType;

    @Column(name = "qty", precision = 10, scale = 2, nullable = false)
    private BigDecimal qty;

    @Column(name = "inout_date", nullable = false)
    private LocalDate inoutDate;

    @Column(name = "used_equip_id")
    private Long usedEquipId;

    @Column(name = "reason", length = 500)
    private String reason;

    @Column(name = "inout_by", length = 100)
    private String inoutBy;

    @Column(name = "remark", columnDefinition = "TEXT")
    private String remark;

    public static EquipSpareInout create(Long spareId, String inoutType, BigDecimal qty,
                                         LocalDate inoutDate, Long usedEquipId, String reason,
                                         String inoutBy, String remark) {
        EquipSpareInout e = new EquipSpareInout();
        e.spareId = spareId;
        e.inoutType = inoutType;
        e.qty = qty;
        e.inoutDate = inoutDate;
        e.usedEquipId = usedEquipId;
        e.reason = reason;
        e.inoutBy = inoutBy;
        e.remark = remark;
        return e;
    }
}
