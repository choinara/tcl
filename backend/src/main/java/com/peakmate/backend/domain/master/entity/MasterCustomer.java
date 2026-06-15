package com.peakmate.backend.domain.master.entity;

import com.peakmate.core.audit.AuditableEntity;
import jakarta.persistence.*;
import lombok.Getter;

@Getter
@Entity
@Table(name = "master_customer")
public class MasterCustomer extends AuditableEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "seq_id")
    private Long id;

    @Column(name = "customer_code", length = 50)
    private String customerCode;

    @Column(name = "customer_name", length = 200)
    private String customerName;

    @Column(name = "location", length = 500)
    private String location;

    @Column(name = "is_active", length = 1, nullable = false)
    private String isActive = "Y";

    public static MasterCustomer create(String customerCode, String customerName, String location) {
        MasterCustomer c = new MasterCustomer();
        c.customerCode = customerCode;
        c.customerName = customerName;
        c.location = location;
        c.isActive = "Y";
        return c;
    }

    public void update(String customerCode, String customerName, String location, String isActive) {
        this.customerCode = customerCode;
        this.customerName = customerName;
        this.location = location;
        if (isActive != null) this.isActive = isActive;
    }
}
