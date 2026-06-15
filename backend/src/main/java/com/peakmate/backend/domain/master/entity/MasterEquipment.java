package com.peakmate.backend.domain.master.entity;

import com.peakmate.core.audit.AuditableEntity;
import jakarta.persistence.*;
import lombok.Getter;
import java.math.BigDecimal;
import java.time.LocalDate;

@Getter
@Entity
@Table(name = "master_equipment")
public class MasterEquipment extends AuditableEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "seq_id")
    private Long id;

    @Column(name = "category", length = 50)
    private String category;

    @Column(name = "unit_number", length = 50)
    private String unitNumber;

    @Column(name = "line_name", length = 100)
    private String lineName;

    @Column(name = "max_speed", precision = 10, scale = 2)
    private BigDecimal maxSpeed;

    @Column(name = "is_active", length = 1, nullable = false)
    private String isActive = "Y";

    @Column(name = "equip_code", length = 30)
    private String equipCode;

    @Column(name = "model_nm", length = 100)
    private String modelNm;

    @Column(name = "manufacturer", length = 100)
    private String manufacturer;

    @Column(name = "purchase_corp_code", length = 30)
    private String purchaseCorpCode;

    @Column(name = "buy_date")
    private LocalDate buyDate;

    @Column(name = "voltage", length = 50)
    private String voltage;

    @Column(name = "pressure", length = 50)
    private String pressure;

    @Column(name = "install_location", length = 200)
    private String installLocation;

    @Column(name = "equip_type_code", length = 30)
    private String equipTypeCode;

    @Column(name = "tact_time", precision = 10, scale = 2)
    private BigDecimal tactTime;

    @Column(name = "equip_capa", precision = 10, scale = 2)
    private BigDecimal equipCapa;

    public static MasterEquipment create(String category, String unitNumber, String lineName, BigDecimal maxSpeed) {
        MasterEquipment c = new MasterEquipment();
        c.category = category;
        c.unitNumber = unitNumber;
        c.lineName = lineName;
        c.maxSpeed = maxSpeed;
        c.isActive = "Y";
        return c;
    }

    public void update(String category, String unitNumber, String lineName, BigDecimal maxSpeed, String isActive) {
        this.category = category;
        this.unitNumber = unitNumber;
        this.lineName = lineName;
        this.maxSpeed = maxSpeed;
        if (isActive != null) this.isActive = isActive;
    }

    public void updateExtended(String equipCode, String modelNm, String manufacturer,
                               String purchaseCorpCode, LocalDate buyDate,
                               String voltage, String pressure, String installLocation,
                               String equipTypeCode, BigDecimal tactTime, BigDecimal equipCapa) {
        this.equipCode = equipCode;
        this.modelNm = modelNm;
        this.manufacturer = manufacturer;
        this.purchaseCorpCode = purchaseCorpCode;
        this.buyDate = buyDate;
        this.voltage = voltage;
        this.pressure = pressure;
        this.installLocation = installLocation;
        this.equipTypeCode = equipTypeCode;
        this.tactTime = tactTime;
        this.equipCapa = equipCapa;
    }
}
