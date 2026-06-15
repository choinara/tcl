package com.peakmate.backend.domain.email.entity;

import com.peakmate.core.audit.AuditableEntity;
import jakarta.persistence.*;
import lombok.Getter;

@Getter
@Entity
@Table(name = "email_customer_mapping")
public class EmailCustomerMapping extends AuditableEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "customer_code", length = 50, nullable = false)
    private String customerCode;

    @Column(name = "customer_name", length = 200, nullable = false)
    private String customerName;

    @Column(name = "email_or_domain", length = 320, nullable = false)
    private String emailOrDomain;

    @Column(name = "mapping_type", length = 10, nullable = false)
    private String mappingType;

    @Column(name = "is_active", length = 1, nullable = false)
    private String isActive = "Y";

    @Column(name = "sort_order", nullable = false)
    private Integer sortOrder = 0;

    protected EmailCustomerMapping() {
    }

    public static EmailCustomerMapping create(String customerCode, String customerName,
                                               String emailOrDomain, String mappingType,
                                               Integer sortOrder) {
        EmailCustomerMapping e = new EmailCustomerMapping();
        e.customerCode = customerCode;
        e.customerName = customerName;
        e.emailOrDomain = emailOrDomain;
        e.mappingType = mappingType;
        e.isActive = "Y";
        e.sortOrder = sortOrder != null ? sortOrder : 0;
        return e;
    }

    public void update(String customerCode, String customerName,
                       String emailOrDomain, String mappingType,
                       String isActive, Integer sortOrder) {
        this.customerCode = customerCode;
        this.customerName = customerName;
        this.emailOrDomain = emailOrDomain;
        this.mappingType = mappingType;
        this.isActive = isActive;
        this.sortOrder = sortOrder != null ? sortOrder : 0;
    }
}
