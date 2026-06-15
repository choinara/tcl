package com.peakmate.backend.domain.organization.entity;

import com.peakmate.core.audit.AuditableEntity;
import jakarta.persistence.*;
import lombok.Getter;

@Getter
@Entity
@Table(name = "company")
public class Company extends AuditableEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "seq_id")
    private Long id;

    @Column(name = "company_code", length = 50, nullable = false, unique = true)
    private String companyCode;

    @Column(name = "company_name", length = 200, nullable = false)
    private String companyName;

    @Column(name = "company_type", length = 50)
    private String companyType;

    @Column(name = "parent_id")
    private Long parentId;

    @Column(name = "country", length = 50)
    private String country;

    @Column(name = "address", length = 500)
    private String address;

    @Column(name = "phone", length = 30)
    private String phone;

    @Column(name = "fax", length = 30)
    private String fax;

    @Column(name = "ceo_name", length = 100)
    private String ceoName;

    @Column(name = "business_number", length = 30)
    private String businessNumber;

    @Column(name = "is_active", length = 1, nullable = false)
    private String isActive = "Y";

    public static Company create(String companyCode, String companyName, String companyType,
                                 Long parentId, String country, String address, String phone,
                                 String fax, String ceoName, String businessNumber) {
        Company c = new Company();
        c.companyCode = companyCode;
        c.companyName = companyName;
        c.companyType = companyType;
        c.parentId = parentId;
        c.country = country;
        c.address = address;
        c.phone = phone;
        c.fax = fax;
        c.ceoName = ceoName;
        c.businessNumber = businessNumber;
        c.isActive = "Y";
        return c;
    }

    public void update(String companyName, String companyType, Long parentId, String country,
                       String address, String phone, String fax, String ceoName,
                       String businessNumber, String isActive) {
        this.companyName = companyName;
        this.companyType = companyType;
        this.parentId = parentId;
        this.country = country;
        this.address = address;
        this.phone = phone;
        this.fax = fax;
        this.ceoName = ceoName;
        this.businessNumber = businessNumber;
        if (isActive != null) this.isActive = isActive;
    }
}
