package com.peakmate.backend.domain.receipt.entity;

import com.peakmate.core.audit.AuditableEntity;
import jakarta.persistence.*;
import lombok.Getter;

@Getter
@Entity
@Table(name = "receipt_record")
public class ReceiptRecord extends AuditableEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "seq_id")
    private Long id;

    @Column(name = "program_name", length = 100)
    private String programName;

    @Column(name = "pd_name", length = 100)
    private String pdName;

    @Column(name = "shooting_date", length = 7)
    private String shootingDate;

    @Column(name = "receipt_type", nullable = false, length = 20)
    private String receiptType;

    @Column(name = "receipt_type_label", length = 20)
    private String receiptTypeLabel;

    @Column(name = "receipt_date", length = 10)
    private String receiptDate;

    @Column(name = "receipt_time", length = 5)
    private String receiptTime;

    @Column(name = "location", length = 200)
    private String location;

    @Column(name = "purpose", length = 200)
    private String purpose;

    @Column(name = "detail", length = 500)
    private String detail;

    @Column(name = "user_name", length = 100)
    private String userName;

    @Column(name = "amount")
    private Long amount = 0L;

    @Column(name = "submitter", length = 100)
    private String submitter;

    @Column(name = "is_active", length = 1, nullable = false)
    private String isActive = "Y";

    public static ReceiptRecord create(String programName, String pdName, String shootingDate,
            String receiptType, String receiptTypeLabel,
            String receiptDate, String receiptTime, String location, String purpose,
            String detail, String userName, Long amount, String submitter) {
        ReceiptRecord r = new ReceiptRecord();
        r.programName = programName;
        r.pdName = pdName;
        r.shootingDate = shootingDate;
        r.receiptType = receiptType != null ? receiptType : "travel";
        r.receiptTypeLabel = receiptTypeLabel;
        r.receiptDate = receiptDate;
        r.receiptTime = receiptTime;
        r.location = location;
        r.purpose = purpose;
        r.detail = detail;
        r.userName = userName;
        r.amount = amount != null ? amount : 0L;
        r.submitter = submitter;
        r.isActive = "Y";
        return r;
    }

    public void update(String programName, String pdName, String shootingDate,
            String receiptType, String receiptTypeLabel,
            String receiptDate, String receiptTime, String location, String purpose,
            String detail, String userName, Long amount, String submitter) {
        this.programName = programName;
        this.pdName = pdName;
        this.shootingDate = shootingDate;
        if (receiptType != null) this.receiptType = receiptType;
        this.receiptTypeLabel = receiptTypeLabel;
        this.receiptDate = receiptDate;
        this.receiptTime = receiptTime;
        this.location = location;
        this.purpose = purpose;
        this.detail = detail;
        this.userName = userName;
        if (amount != null) this.amount = amount;
        this.submitter = submitter;
    }

    public void deactivate() {
        this.isActive = "N";
    }
}
