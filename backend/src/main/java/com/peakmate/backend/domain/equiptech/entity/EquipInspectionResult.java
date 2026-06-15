package com.peakmate.backend.domain.equiptech.entity;

import com.peakmate.core.audit.AuditableEntity;
import jakarta.persistence.*;
import lombok.Getter;

@Getter
@Entity
@Table(name = "equip_inspection_result")
public class EquipInspectionResult extends AuditableEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "seq_id")
    private Long id;

    @Column(name = "inspection_id", nullable = false)
    private Long inspectionId;

    @Column(name = "item_no", nullable = false)
    private Integer itemNo;

    @Column(name = "result_code", length = 30)
    private String resultCode;

    @Column(name = "note", length = 200)
    private String note;

    public static EquipInspectionResult create(Long inspectionId, Integer itemNo,
                                               String resultCode, String note) {
        EquipInspectionResult e = new EquipInspectionResult();
        e.inspectionId = inspectionId;
        e.itemNo = itemNo;
        e.resultCode = resultCode;
        e.note = note;
        return e;
    }

    public void update(String resultCode, String note) {
        this.resultCode = resultCode;
        this.note = note;
    }
}
