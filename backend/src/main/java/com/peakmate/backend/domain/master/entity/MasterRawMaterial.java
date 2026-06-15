package com.peakmate.backend.domain.master.entity;

import com.peakmate.core.audit.AuditableEntity;
import jakarta.persistence.*;
import lombok.Getter;

@Getter
@Entity
@Table(name = "master_raw_material")
public class MasterRawMaterial extends AuditableEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "seq_id")
    private Long id;

    @Column(name = "material_code", length = 50)
    private String materialCode;

    @Column(name = "material_type", length = 100)
    private String materialType;

    @Column(name = "model_name", length = 200)
    private String modelName;

    @Column(name = "supplier_name", length = 200)
    private String supplierName;

    @Column(name = "raw_material", length = 200)
    private String rawMaterial;

    @Column(name = "product_spec", length = 200)
    private String productSpec;

    @Column(name = "hardness_type", length = 50)
    private String hardnessType;

    @Column(name = "is_active", length = 1, nullable = false)
    private String isActive = "Y";

    public static MasterRawMaterial create(String materialCode, String materialType, String modelName, String supplierName,
                                           String rawMaterial, String productSpec, String hardnessType) {
        MasterRawMaterial c = new MasterRawMaterial();
        c.materialCode = materialCode;
        c.materialType = materialType;
        c.modelName = modelName;
        c.supplierName = supplierName;
        c.rawMaterial = rawMaterial;
        c.productSpec = productSpec;
        c.hardnessType = hardnessType;
        c.isActive = "Y";
        return c;
    }

    public void update(String materialCode, String materialType, String modelName, String supplierName,
                       String rawMaterial, String productSpec, String hardnessType, String isActive) {
        this.materialCode = materialCode;
        this.materialType = materialType;
        this.modelName = modelName;
        this.supplierName = supplierName;
        this.rawMaterial = rawMaterial;
        this.productSpec = productSpec;
        this.hardnessType = hardnessType;
        if (isActive != null) this.isActive = isActive;
    }
}
