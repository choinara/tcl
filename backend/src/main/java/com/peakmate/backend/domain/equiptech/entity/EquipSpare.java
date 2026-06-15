package com.peakmate.backend.domain.equiptech.entity;

import com.peakmate.core.audit.AuditableEntity;
import jakarta.persistence.*;
import lombok.Getter;

import java.math.BigDecimal;

@Getter
@Entity
@Table(name = "equip_spare")
public class EquipSpare extends AuditableEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "seq_id")
    private Long id;

    @Column(name = "spare_code", length = 30, nullable = false)
    private String spareCode;

    @Column(name = "spare_name", length = 200, nullable = false)
    private String spareName;

    @Column(name = "spare_spec", length = 200)
    private String spareSpec;

    @Column(name = "unit", length = 50)
    private String unit;

    @Column(name = "unit_price", precision = 15, scale = 2)
    private BigDecimal unitPrice;

    @Column(name = "stock_qty", precision = 10, scale = 2, nullable = false)
    private BigDecimal stockQty = BigDecimal.ZERO;

    @Column(name = "min_stock_qty", precision = 10, scale = 2, nullable = false)
    private BigDecimal minStockQty = BigDecimal.ZERO;

    @Column(name = "spare_type_code", length = 30)
    private String spareTypeCode;

    @Column(name = "equip_category_code", length = 30)
    private String equipCategoryCode;

    @Column(name = "is_active", length = 1, nullable = false)
    private String isActive = "Y";

    @Column(name = "remark", columnDefinition = "TEXT")
    private String remark;

    public static EquipSpare create(String spareCode, String spareName, String spareSpec,
                                    String unit, BigDecimal unitPrice, BigDecimal stockQty,
                                    BigDecimal minStockQty, String spareTypeCode,
                                    String equipCategoryCode, String isActive, String remark) {
        EquipSpare e = new EquipSpare();
        e.spareCode = spareCode;
        e.spareName = spareName;
        e.spareSpec = spareSpec;
        e.unit = unit;
        e.unitPrice = unitPrice;
        e.stockQty = stockQty != null ? stockQty : BigDecimal.ZERO;
        e.minStockQty = minStockQty != null ? minStockQty : BigDecimal.ZERO;
        e.spareTypeCode = spareTypeCode;
        e.equipCategoryCode = equipCategoryCode;
        e.isActive = isActive != null ? isActive : "Y";
        e.remark = remark;
        return e;
    }

    public void update(String spareName, String spareSpec, String unit, BigDecimal unitPrice,
                       BigDecimal stockQty, BigDecimal minStockQty, String spareTypeCode,
                       String equipCategoryCode, String isActive, String remark) {
        this.spareName = spareName;
        this.spareSpec = spareSpec;
        this.unit = unit;
        this.unitPrice = unitPrice;
        if (stockQty != null) this.stockQty = stockQty;
        if (minStockQty != null) this.minStockQty = minStockQty;
        this.spareTypeCode = spareTypeCode;
        this.equipCategoryCode = equipCategoryCode;
        if (isActive != null) this.isActive = isActive;
        this.remark = remark;
    }

    public void adjustStock(BigDecimal delta) {
        this.stockQty = this.stockQty.add(delta);
    }
}
