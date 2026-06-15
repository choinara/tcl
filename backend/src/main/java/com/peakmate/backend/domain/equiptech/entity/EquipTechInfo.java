package com.peakmate.backend.domain.equiptech.entity;

import com.peakmate.core.audit.AuditableEntity;
import jakarta.persistence.*;
import lombok.Getter;

@Getter
@Entity
@Table(name = "equip_tech_info")
public class EquipTechInfo extends AuditableEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "seq_id")
    private Long id;

    @Column(name = "equip_category_code", length = 30, nullable = false)
    private String equipCategoryCode;

    @Column(name = "mtbf_target_min")
    private Integer mtbfTargetMin;

    @Column(name = "mtbf_ucl_min")
    private Integer mtbfUclMin;

    @Column(name = "mtbf_loss_type_codes", columnDefinition = "TEXT")
    private String mtbfLossTypeCodes;

    @Column(name = "mttr_target_min")
    private Integer mttrTargetMin;

    @Column(name = "mttr_ucl_min")
    private Integer mttrUclMin;

    @Column(name = "mttr_loss_type_codes", columnDefinition = "TEXT")
    private String mttrLossTypeCodes;

    public static EquipTechInfo create(String equipCategoryCode) {
        EquipTechInfo e = new EquipTechInfo();
        e.equipCategoryCode = equipCategoryCode;
        e.mtbfTargetMin = 480;
        e.mtbfUclMin = 720;
        e.mttrTargetMin = 30;
        e.mttrUclMin = 60;
        return e;
    }

    public void upsert(Integer mtbfTargetMin, Integer mtbfUclMin, String mtbfLossTypeCodes,
                       Integer mttrTargetMin, Integer mttrUclMin, String mttrLossTypeCodes) {
        this.mtbfTargetMin = mtbfTargetMin;
        this.mtbfUclMin = mtbfUclMin;
        this.mtbfLossTypeCodes = mtbfLossTypeCodes;
        this.mttrTargetMin = mttrTargetMin;
        this.mttrUclMin = mttrUclMin;
        this.mttrLossTypeCodes = mttrLossTypeCodes;
    }
}
