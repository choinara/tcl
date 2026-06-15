package com.peakmate.backend.domain.master.entity;

import com.peakmate.core.audit.AuditableEntity;
import jakarta.persistence.*;
import lombok.Getter;

@Getter
@Entity
@Table(name = "master_appearance_inspection")
public class MasterAppearanceInspection extends AuditableEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "seq_id")
    private Long id;

    @Column(name = "defect_name", length = 200)
    private String defectName;

    @Column(name = "category", length = 100)
    private String category;

    @Column(name = "sub_category", length = 200)
    private String subCategory;

    @Column(name = "requirement", length = 500)
    private String requirement;

    @Column(name = "is_active", length = 1, nullable = false)
    private String isActive = "Y";

    public static MasterAppearanceInspection create(String defectName, String category, String subCategory, String requirement) {
        MasterAppearanceInspection c = new MasterAppearanceInspection();
        c.defectName = defectName;
        c.category = category;
        c.subCategory = subCategory;
        c.requirement = requirement;
        c.isActive = "Y";
        return c;
    }

    public void update(String defectName, String category, String subCategory, String requirement, String isActive) {
        this.defectName = defectName;
        this.category = category;
        this.subCategory = subCategory;
        this.requirement = requirement;
        if (isActive != null) this.isActive = isActive;
    }
}
