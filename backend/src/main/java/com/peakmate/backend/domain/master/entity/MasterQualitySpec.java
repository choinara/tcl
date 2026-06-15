package com.peakmate.backend.domain.master.entity;

import com.peakmate.core.audit.AuditableEntity;
import jakarta.persistence.*;
import lombok.Getter;

@Getter
@Entity
@Table(name = "master_quality_spec")
public class MasterQualitySpec extends AuditableEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "seq_id")
    private Long id;

    @Column(name = "customer_name", length = 200)
    private String customerName;

    @Column(name = "classification", length = 200)
    private String classification;

    @Column(name = "anode_spec", length = 500)
    private String anodeSpec;

    @Column(name = "cathode_spec", length = 500)
    private String cathodeSpec;

    @Column(name = "is_active", length = 1, nullable = false)
    private String isActive = "Y";

    public static MasterQualitySpec create(String customerName, String classification,
                                           String anodeSpec, String cathodeSpec) {
        MasterQualitySpec c = new MasterQualitySpec();
        c.customerName = customerName;
        c.classification = classification;
        c.anodeSpec = anodeSpec;
        c.cathodeSpec = cathodeSpec;
        c.isActive = "Y";
        return c;
    }

    public void update(String customerName, String classification,
                       String anodeSpec, String cathodeSpec, String isActive) {
        this.customerName = customerName;
        this.classification = classification;
        this.anodeSpec = anodeSpec;
        this.cathodeSpec = cathodeSpec;
        if (isActive != null) this.isActive = isActive;
    }
}
