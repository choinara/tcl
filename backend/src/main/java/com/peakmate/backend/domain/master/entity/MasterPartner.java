package com.peakmate.backend.domain.master.entity;

import com.peakmate.core.audit.AuditableEntity;
import jakarta.persistence.*;
import lombok.Getter;

@Getter
@Entity
@Table(name = "master_partner")
public class MasterPartner extends AuditableEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "seq_id")
    private Long id;

    @Column(name = "partner_code", length = 50, nullable = false, unique = true)
    private String partnerCode;

    @Column(name = "partner_name", length = 200, nullable = false)
    private String partnerName;

    @Column(name = "partner_type", length = 30, nullable = false)
    private String partnerType;

    @Column(name = "business_number", length = 20)
    private String businessNumber;

    @Column(name = "ceo_name", length = 100)
    private String ceoName;

    @Column(name = "business_category", length = 100)
    private String businessCategory;

    @Column(name = "business_type", length = 100)
    private String businessType;

    @Column(name = "phone", length = 20)
    private String phone;

    @Column(name = "fax", length = 20)
    private String fax;

    @Column(name = "email", length = 200)
    private String email;

    @Column(name = "address", length = 500)
    private String address;

    @Column(name = "transaction_status", length = 20, nullable = false)
    private String transactionStatus = "ACTIVE";

    @Column(name = "remark", length = 1000)
    private String remark;

    @Column(name = "is_active", length = 1, nullable = false)
    private String isActive = "Y";

    public static MasterPartner create(String partnerCode, String partnerName, String partnerType,
                                        String businessNumber, String ceoName,
                                        String businessCategory, String businessType,
                                        String phone, String fax, String email, String address,
                                        String transactionStatus, String remark) {
        MasterPartner e = new MasterPartner();
        e.partnerCode = partnerCode;
        e.partnerName = partnerName;
        e.partnerType = partnerType;
        e.businessNumber = businessNumber;
        e.ceoName = ceoName;
        e.businessCategory = businessCategory;
        e.businessType = businessType;
        e.phone = phone;
        e.fax = fax;
        e.email = email;
        e.address = address;
        e.transactionStatus = transactionStatus != null ? transactionStatus : "ACTIVE";
        e.remark = remark;
        e.isActive = "Y";
        return e;
    }

    public void update(String partnerCode, String partnerName, String partnerType,
                       String businessNumber, String ceoName,
                       String businessCategory, String businessType,
                       String phone, String fax, String email, String address,
                       String transactionStatus, String remark, String isActive) {
        this.partnerCode = partnerCode;
        this.partnerName = partnerName;
        this.partnerType = partnerType;
        this.businessNumber = businessNumber;
        this.ceoName = ceoName;
        this.businessCategory = businessCategory;
        this.businessType = businessType;
        this.phone = phone;
        this.fax = fax;
        this.email = email;
        this.address = address;
        this.transactionStatus = transactionStatus;
        this.remark = remark;
        if (isActive != null) this.isActive = isActive;
    }
}
