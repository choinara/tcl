package com.peakmate.backend.domain.master.entity;

import com.peakmate.core.audit.AuditableEntity;
import jakarta.persistence.*;
import lombok.Getter;
import java.math.BigDecimal;

@Getter
@Entity
@Table(name = "master_product")
public class MasterProduct extends AuditableEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "seq_id")
    private Long id;

    @Column(name = "model_name", length = 200)
    private String modelName;

    @Column(name = "raw_material", length = 200)
    private String rawMaterial;

    @Column(name = "material_type", length = 100)
    private String materialType;

    @Column(name = "customer_name", length = 200)
    private String customerName;

    @Column(name = "plating_thickness", length = 100)
    private String platingThickness;

    @Column(name = "product_spec", length = 200)
    private String productSpec;

    @Column(name = "process_rolling", length = 1)
    private String processRolling = "N";

    @Column(name = "process_plating", length = 1)
    private String processPlating = "N";

    @Column(name = "process_heat_treatment", length = 1)
    private String processHeatTreatment = "N";

    @Column(name = "process_surface_treatment", length = 1)
    private String processSurfaceTreatment = "N";

    @Column(name = "process_packaging", length = 1)
    private String processPackaging = "N";

    @Column(name = "thickness", length = 100)
    private String thickness;

    @Column(name = "width", length = 100)
    private String width;

    @Column(name = "unit_conversion", precision = 10, scale = 4)
    private BigDecimal unitConversion;

    @Column(name = "is_active", length = 1, nullable = false)
    private String isActive = "Y";

    public static MasterProduct create(String modelName, String rawMaterial, String materialType,
                                       String customerName, String platingThickness, String productSpec,
                                       String processRolling, String processPlating, String processHeatTreatment,
                                       String processSurfaceTreatment, String processPackaging,
                                       String thickness, String width, BigDecimal unitConversion) {
        MasterProduct c = new MasterProduct();
        c.modelName = modelName;
        c.rawMaterial = rawMaterial;
        c.materialType = materialType;
        c.customerName = customerName;
        c.platingThickness = platingThickness;
        c.productSpec = productSpec;
        c.processRolling = processRolling;
        c.processPlating = processPlating;
        c.processHeatTreatment = processHeatTreatment;
        c.processSurfaceTreatment = processSurfaceTreatment;
        c.processPackaging = processPackaging;
        c.thickness = thickness;
        c.width = width;
        c.unitConversion = unitConversion;
        c.isActive = "Y";
        return c;
    }

    public void update(String modelName, String rawMaterial, String materialType,
                       String customerName, String platingThickness, String productSpec,
                       String processRolling, String processPlating, String processHeatTreatment,
                       String processSurfaceTreatment, String processPackaging,
                       String thickness, String width, BigDecimal unitConversion, String isActive) {
        this.modelName = modelName;
        this.rawMaterial = rawMaterial;
        this.materialType = materialType;
        this.customerName = customerName;
        this.platingThickness = platingThickness;
        this.productSpec = productSpec;
        this.processRolling = processRolling;
        this.processPlating = processPlating;
        this.processHeatTreatment = processHeatTreatment;
        this.processSurfaceTreatment = processSurfaceTreatment;
        this.processPackaging = processPackaging;
        this.thickness = thickness;
        this.width = width;
        this.unitConversion = unitConversion;
        if (isActive != null) this.isActive = isActive;
    }
}
