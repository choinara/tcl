package com.peakmate.backend.domain.equiptech.entity;

import com.peakmate.core.audit.AuditableEntity;
import jakarta.persistence.*;
import lombok.Getter;

import java.time.LocalDate;

@Getter
@Entity
@Table(name = "equip_inspection")
public class EquipInspection extends AuditableEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "seq_id")
    private Long id;

    @Column(name = "equip_id")
    private Long equipId;

    @Column(name = "inspect_date", nullable = false)
    private LocalDate inspectDate;

    @Column(name = "inspector", length = 100)
    private String inspector;

    @Column(name = "status", length = 20, nullable = false)
    private String status = "PENDING";

    @Column(name = "remark", columnDefinition = "TEXT")
    private String remark;

    public static EquipInspection create(Long equipId, LocalDate inspectDate,
                                         String inspector, String status, String remark) {
        EquipInspection e = new EquipInspection();
        e.equipId = equipId;
        e.inspectDate = inspectDate;
        e.inspector = inspector;
        e.status = status != null ? status : "PENDING";
        e.remark = remark;
        return e;
    }

    public void update(Long equipId, LocalDate inspectDate,
                       String inspector, String status, String remark) {
        this.equipId = equipId;
        this.inspectDate = inspectDate;
        this.inspector = inspector;
        if (status != null) this.status = status;
        this.remark = remark;
    }
}
