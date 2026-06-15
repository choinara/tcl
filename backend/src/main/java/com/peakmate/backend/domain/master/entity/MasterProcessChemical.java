package com.peakmate.backend.domain.master.entity;

import com.peakmate.core.audit.AuditableEntity;
import jakarta.persistence.*;
import lombok.Getter;

@Getter
@Entity
@Table(name = "master_process_chemical")
public class MasterProcessChemical extends AuditableEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "seq_id")
    private Long id;

    @Column(name = "category", length = 50)
    private String category;

    @Column(name = "process_name", length = 200)
    private String processName;

    @Column(name = "product_name", length = 200)
    private String productName;

    @Column(name = "is_active", length = 1, nullable = false)
    private String isActive = "Y";

    public static MasterProcessChemical create(String category, String processName, String productName) {
        MasterProcessChemical c = new MasterProcessChemical();
        c.category = category;
        c.processName = processName;
        c.productName = productName;
        c.isActive = "Y";
        return c;
    }

    public void update(String category, String processName, String productName, String isActive) {
        this.category = category;
        this.processName = processName;
        this.productName = productName;
        if (isActive != null) this.isActive = isActive;
    }
}
