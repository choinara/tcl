package com.peakmate.backend.domain.master.entity;

import com.peakmate.core.audit.AuditableEntity;
import jakarta.persistence.*;
import lombok.Getter;

@Getter
@Entity
@Table(name = "master_supplier")
public class MasterSupplier extends AuditableEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "seq_id")
    private Long id;

    @Column(name = "supplier_code", length = 50)
    private String supplierCode;

    @Column(name = "company_name", length = 200)
    private String companyName;

    @Column(name = "category", length = 50)
    private String category;

    @Column(name = "item", length = 200)
    private String item;

    @Column(name = "is_active", length = 1, nullable = false)
    private String isActive = "Y";

    public static MasterSupplier create(String supplierCode, String companyName, String category, String item) {
        MasterSupplier c = new MasterSupplier();
        c.supplierCode = supplierCode;
        c.companyName = companyName;
        c.category = category;
        c.item = item;
        c.isActive = "Y";
        return c;
    }

    public void update(String supplierCode, String companyName, String category, String item, String isActive) {
        this.supplierCode = supplierCode;
        this.companyName = companyName;
        this.category = category;
        this.item = item;
        if (isActive != null) this.isActive = isActive;
    }
}
