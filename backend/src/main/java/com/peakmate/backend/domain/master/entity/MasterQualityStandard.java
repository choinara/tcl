package com.peakmate.backend.domain.master.entity;

import com.peakmate.core.audit.AuditableEntity;
import jakarta.persistence.*;
import lombok.Getter;

@Getter
@Entity
@Table(name = "master_quality_standard")
public class MasterQualityStandard extends AuditableEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "seq_id")
    private Long id;

    @Column(name = "customer_name", length = 200)
    private String customerName;

    @Column(name = "category", length = 100)
    private String category;

    @Column(name = "variety", length = 200)
    private String variety;

    @Column(name = "surface_treatment", length = 200)
    private String surfaceTreatment;

    @Column(name = "spec_thickness", length = 100)
    private String specThickness;

    @Column(name = "spec_width", length = 100)
    private String specWidth;

    @Column(name = "spec_burr", length = 100)
    private String specBurr;

    @Column(name = "spec_edge_w", length = 100)
    private String specEdgeW;

    @Column(name = "spec_edge_t", length = 100)
    private String specEdgeT;

    @Column(name = "spec_plating_thickness", length = 100)
    private String specPlatingThickness;

    @Column(name = "spec_plating_adhesion", length = 100)
    private String specPlatingAdhesion;

    @Column(name = "spec_salt_spray", length = 100)
    private String specSaltSpray;

    @Column(name = "spec_cr_amount", length = 100)
    private String specCrAmount;

    @Column(name = "spec_appearance", length = 200)
    private String specAppearance;

    @Column(name = "spec_surface_roughness", length = 100)
    private String specSurfaceRoughness;

    @Column(name = "spec_delta_cr", length = 100)
    private String specDeltaCr;

    @Column(name = "spec_icp", length = 200)
    private String specIcp;

    @Column(name = "is_active", length = 1, nullable = false)
    private String isActive = "Y";

    public static MasterQualityStandard create(String customerName, String category, String variety,
                                               String surfaceTreatment, String specThickness, String specWidth,
                                               String specBurr, String specEdgeW, String specEdgeT,
                                               String specPlatingThickness, String specPlatingAdhesion,
                                               String specSaltSpray, String specCrAmount, String specAppearance,
                                               String specSurfaceRoughness, String specDeltaCr, String specIcp) {
        MasterQualityStandard c = new MasterQualityStandard();
        c.customerName = customerName;
        c.category = category;
        c.variety = variety;
        c.surfaceTreatment = surfaceTreatment;
        c.specThickness = specThickness;
        c.specWidth = specWidth;
        c.specBurr = specBurr;
        c.specEdgeW = specEdgeW;
        c.specEdgeT = specEdgeT;
        c.specPlatingThickness = specPlatingThickness;
        c.specPlatingAdhesion = specPlatingAdhesion;
        c.specSaltSpray = specSaltSpray;
        c.specCrAmount = specCrAmount;
        c.specAppearance = specAppearance;
        c.specSurfaceRoughness = specSurfaceRoughness;
        c.specDeltaCr = specDeltaCr;
        c.specIcp = specIcp;
        c.isActive = "Y";
        return c;
    }

    public void update(String customerName, String category, String variety,
                       String surfaceTreatment, String specThickness, String specWidth,
                       String specBurr, String specEdgeW, String specEdgeT,
                       String specPlatingThickness, String specPlatingAdhesion,
                       String specSaltSpray, String specCrAmount, String specAppearance,
                       String specSurfaceRoughness, String specDeltaCr, String specIcp,
                       String isActive) {
        this.customerName = customerName;
        this.category = category;
        this.variety = variety;
        this.surfaceTreatment = surfaceTreatment;
        this.specThickness = specThickness;
        this.specWidth = specWidth;
        this.specBurr = specBurr;
        this.specEdgeW = specEdgeW;
        this.specEdgeT = specEdgeT;
        this.specPlatingThickness = specPlatingThickness;
        this.specPlatingAdhesion = specPlatingAdhesion;
        this.specSaltSpray = specSaltSpray;
        this.specCrAmount = specCrAmount;
        this.specAppearance = specAppearance;
        this.specSurfaceRoughness = specSurfaceRoughness;
        this.specDeltaCr = specDeltaCr;
        this.specIcp = specIcp;
        if (isActive != null) this.isActive = isActive;
    }
}
