package com.peakmate.backend.domain.master.entity;

import com.peakmate.core.audit.AuditableEntity;
import jakarta.persistence.*;
import lombok.Getter;
import java.math.BigDecimal;

@Getter
@Entity
@Table(name = "master_production_rate")
public class MasterProductionRate extends AuditableEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "seq_id")
    private Long id;

    @Column(name = "raw_material", length = 200)
    private String rawMaterial;

    @Column(name = "model_name", length = 200)
    private String modelName;

    @Column(name = "product_spec", length = 200)
    private String productSpec;

    @Column(name = "material_type", length = 100)
    private String materialType;

    @Column(name = "customer_name", length = 200)
    private String customerName;

    @Column(name = "unit_conversion", precision = 10, scale = 4)
    private BigDecimal unitConversion;

    @Column(name = "rate_4m", precision = 10, scale = 2)
    private BigDecimal rate4m;

    @Column(name = "rate_6m", precision = 10, scale = 2)
    private BigDecimal rate6m;

    @Column(name = "rate_8m", precision = 10, scale = 2)
    private BigDecimal rate8m;

    @Column(name = "is_active", length = 1, nullable = false)
    private String isActive = "Y";

    public static MasterProductionRate create(String rawMaterial, String modelName, String productSpec,
                                              String materialType, String customerName, BigDecimal unitConversion,
                                              BigDecimal rate4m, BigDecimal rate6m, BigDecimal rate8m) {
        MasterProductionRate c = new MasterProductionRate();
        c.rawMaterial = rawMaterial;
        c.modelName = modelName;
        c.productSpec = productSpec;
        c.materialType = materialType;
        c.customerName = customerName;
        c.unitConversion = unitConversion;
        c.rate4m = rate4m;
        c.rate6m = rate6m;
        c.rate8m = rate8m;
        c.isActive = "Y";
        return c;
    }

    public void update(String rawMaterial, String modelName, String productSpec,
                       String materialType, String customerName, BigDecimal unitConversion,
                       BigDecimal rate4m, BigDecimal rate6m, BigDecimal rate8m, String isActive) {
        this.rawMaterial = rawMaterial;
        this.modelName = modelName;
        this.productSpec = productSpec;
        this.materialType = materialType;
        this.customerName = customerName;
        this.unitConversion = unitConversion;
        this.rate4m = rate4m;
        this.rate6m = rate6m;
        this.rate8m = rate8m;
        if (isActive != null) this.isActive = isActive;
    }
}
