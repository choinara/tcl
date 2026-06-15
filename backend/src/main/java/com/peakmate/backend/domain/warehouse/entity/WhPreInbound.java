package com.peakmate.backend.domain.warehouse.entity;

import com.peakmate.core.audit.AuditableEntity;
import jakarta.persistence.*;
import lombok.Getter;
import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;

@Getter
@Entity
@Table(name = "wh_pre_inbound")
public class WhPreInbound extends AuditableEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "seq_id")
    private Long id;

    @Column(name = "lot_no", length = 100, nullable = false)
    private String lotNo;

    @Column(name = "material_code", length = 50, nullable = false)
    private String materialCode;

    @Column(name = "material_name", length = 200)
    private String materialName;

    @Column(name = "pre_inbound_qty", precision = 12, scale = 2, nullable = false)
    private BigDecimal preInboundQty;

    @Column(name = "weight", precision = 12, scale = 3)
    private BigDecimal weight;

    @Column(name = "supplier_code", length = 50, nullable = false)
    private String supplierCode;

    @Column(name = "supplier_name", length = 200)
    private String supplierName;

    @Column(name = "pre_inbound_date", nullable = false)
    private LocalDate preInboundDate;

    @Column(name = "barcode_no", length = 100)
    private String barcodeNo;

    @Column(name = "po_number", length = 100)
    private String poNumber;

    @Column(name = "status_cd", length = 20, nullable = false)
    private String statusCd = "가입고";

    @Column(name = "approval_cd", length = 20, nullable = false)
    private String approvalCd = "미승인";

    @Column(name = "inspect_qty", precision = 12, scale = 2)
    private BigDecimal inspectQty;

    @Column(name = "diff_qty", precision = 12, scale = 2)
    private BigDecimal diffQty;

    @Column(name = "remain_qty", precision = 12, scale = 2)
    private BigDecimal remainQty;

    @Column(name = "material_type", length = 100)
    private String materialType;

    @Column(name = "product_spec", length = 200)
    private String productSpec;

    @Column(name = "raw_material", length = 200)
    private String rawMaterial;

    @Column(name = "hardness_type", length = 50)
    private String hardnessType;

    @Column(name = "inbound_time", length = 5)
    private String inboundTime;

    @Column(name = "inbound_source", length = 100)
    private String inboundSource;

    @Column(name = "pallet_no", length = 50)
    private String palletNo;

    @Column(name = "location_cd", length = 50)
    private String locationCd;

    @Column(name = "remark", columnDefinition = "TEXT")
    private String remark;

    @Column(name = "approved_by", length = 50)
    private String approvedBy;

    @Column(name = "approved_at")
    private LocalDateTime approvedAt;

    @Column(name = "is_active", length = 1, nullable = false)
    private String isActive = "Y";

    public static WhPreInbound create(String lotNo, String materialCode, String materialName,
                                       BigDecimal preInboundQty, BigDecimal weight,
                                       String supplierCode, String supplierName,
                                       LocalDate preInboundDate, String barcodeNo, String poNumber,
                                       String materialType, String productSpec,
                                       String rawMaterial, String hardnessType,
                                       String inboundTime, String inboundSource, String palletNo,
                                       String locationCd, String remark) {
        WhPreInbound e = new WhPreInbound();
        e.lotNo = lotNo;
        e.materialCode = materialCode;
        e.materialName = materialName;
        e.preInboundQty = preInboundQty;
        e.weight = weight;
        e.supplierCode = supplierCode;
        e.supplierName = supplierName;
        e.preInboundDate = preInboundDate;
        e.barcodeNo = barcodeNo;
        e.poNumber = poNumber;
        e.materialType = materialType;
        e.productSpec = productSpec;
        e.rawMaterial = rawMaterial;
        e.hardnessType = hardnessType;
        e.inboundTime = inboundTime;
        e.inboundSource = inboundSource;
        e.palletNo = palletNo;
        e.statusCd = "가입고";
        e.approvalCd = "미승인";
        e.locationCd = locationCd;
        e.remark = remark;
        e.isActive = "Y";
        return e;
    }

    public void update(String lotNo, String materialCode, String materialName,
                       BigDecimal preInboundQty, BigDecimal weight,
                       String supplierCode, String supplierName,
                       LocalDate preInboundDate, String barcodeNo, String poNumber,
                       String materialType, String productSpec,
                       String rawMaterial, String hardnessType,
                       String inboundTime, String inboundSource, String palletNo,
                       BigDecimal inspectQty, BigDecimal diffQty, BigDecimal remainQty,
                       String locationCd, String remark) {
        this.lotNo = lotNo;
        this.materialCode = materialCode;
        this.materialName = materialName;
        this.preInboundQty = preInboundQty;
        this.weight = weight;
        this.supplierCode = supplierCode;
        this.supplierName = supplierName;
        this.preInboundDate = preInboundDate;
        this.barcodeNo = barcodeNo;
        this.poNumber = poNumber;
        this.materialType = materialType;
        this.productSpec = productSpec;
        this.rawMaterial = rawMaterial;
        this.hardnessType = hardnessType;
        this.inboundTime = inboundTime;
        this.inboundSource = inboundSource;
        this.palletNo = palletNo;
        this.inspectQty = inspectQty;
        this.diffQty = diffQty;
        this.remainQty = remainQty;
        this.locationCd = locationCd;
        this.remark = remark;
    }

    /**
     * 승인 처리.
     * approvedAt은 승인 행위의 비즈니스 타임스탬프이며,
     * AuditableEntity의 자동 관리 대상(@CreatedDate/@LastModifiedDate)과 다르다.
     * 따라서 LocalDateTime.now() 수동 호출이 적절하다. (Rule 8-1 예외)
     */
    public void approve(String approvedByUsername) {
        if (!"가입고".equals(this.statusCd) || !"미승인".equals(this.approvalCd)) {
            throw new IllegalStateException("가입고+미승인 상태만 승인할 수 있습니다");
        }
        this.statusCd = "승인완료";
        this.approvalCd = "승인";
        this.approvedBy = approvedByUsername;
        this.approvedAt = LocalDateTime.now();
    }

    public void cancelApproval() {
        if (!"승인완료".equals(this.statusCd) || !"승인".equals(this.approvalCd)) {
            throw new IllegalStateException("승인완료 상태만 승인취소할 수 있습니다");
        }
        this.statusCd = "가입고";
        this.approvalCd = "미승인";
        this.approvedBy = null;
        this.approvedAt = null;
    }

    public void generateBarcode(String barcode) {
        if (this.barcodeNo != null && !this.barcodeNo.isBlank()) {
            throw new IllegalStateException("이미 바코드가 할당되어 있습니다: " + this.barcodeNo);
        }
        this.barcodeNo = barcode;
    }

    public static String formatBarcodeByDate(String datePrefix, long sequence) {
        return datePrefix + "-" + String.format("%03d", sequence);
    }

    public static String formatBarcodeByPo(String poNumber, long sequence) {
        return poNumber + "-" + String.format("%03d", sequence);
    }
}
