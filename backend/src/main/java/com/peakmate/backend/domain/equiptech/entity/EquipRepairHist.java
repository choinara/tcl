package com.peakmate.backend.domain.equiptech.entity;

import com.peakmate.core.audit.AuditableEntity;
import jakarta.persistence.*;
import lombok.Getter;

import java.math.BigDecimal;
import java.time.LocalDate;

@Getter
@Entity
@Table(name = "equip_repair_hist")
public class EquipRepairHist extends AuditableEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "seq_id")
    private Long id;

    @Column(name = "repair_no", length = 20, nullable = false)
    private String repairNo;

    @Column(name = "equip_id")
    private Long equipId;

    @Column(name = "fail_date")
    private LocalDate failDate;

    @Column(name = "repair_start_date")
    private LocalDate repairStartDate;

    @Column(name = "repair_end_date")
    private LocalDate repairEndDate;

    @Column(name = "fail_desc", columnDefinition = "TEXT")
    private String failDesc;

    @Column(name = "repair_desc", columnDefinition = "TEXT")
    private String repairDesc;

    @Column(name = "repair_person", length = 100)
    private String repairPerson;

    @Column(name = "repair_time", precision = 6, scale = 2)
    private BigDecimal repairTime;

    @Column(name = "repair_cost", precision = 15, scale = 2)
    private BigDecimal repairCost;

    @Column(name = "fail_type_code", length = 30)
    private String failTypeCode;

    @Column(name = "shift_code", length = 30)
    private String shiftCode;

    @Column(name = "is_closed", length = 1, nullable = false)
    private String isClosed = "N";

    @Column(name = "remark", columnDefinition = "TEXT")
    private String remark;

    public static EquipRepairHist create(String repairNo, Long equipId, LocalDate failDate,
                                         LocalDate repairStartDate, LocalDate repairEndDate,
                                         String failDesc, String repairDesc, String repairPerson,
                                         BigDecimal repairTime, BigDecimal repairCost,
                                         String failTypeCode, String shiftCode, String isClosed,
                                         String remark) {
        EquipRepairHist e = new EquipRepairHist();
        e.repairNo = repairNo;
        e.equipId = equipId;
        e.failDate = failDate;
        e.repairStartDate = repairStartDate;
        e.repairEndDate = repairEndDate;
        e.failDesc = failDesc;
        e.repairDesc = repairDesc;
        e.repairPerson = repairPerson;
        e.repairTime = repairTime;
        e.repairCost = repairCost;
        e.failTypeCode = failTypeCode;
        e.shiftCode = shiftCode;
        e.isClosed = isClosed != null ? isClosed : "N";
        e.remark = remark;
        return e;
    }

    public void update(Long equipId, LocalDate failDate, LocalDate repairStartDate,
                       LocalDate repairEndDate, String failDesc, String repairDesc,
                       String repairPerson, BigDecimal repairTime, BigDecimal repairCost,
                       String failTypeCode, String shiftCode, String isClosed, String remark) {
        this.equipId = equipId;
        this.failDate = failDate;
        this.repairStartDate = repairStartDate;
        this.repairEndDate = repairEndDate;
        this.failDesc = failDesc;
        this.repairDesc = repairDesc;
        this.repairPerson = repairPerson;
        this.repairTime = repairTime;
        this.repairCost = repairCost;
        this.failTypeCode = failTypeCode;
        this.shiftCode = shiftCode;
        if (isClosed != null) this.isClosed = isClosed;
        this.remark = remark;
    }
}
