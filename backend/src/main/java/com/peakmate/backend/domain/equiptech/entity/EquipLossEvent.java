package com.peakmate.backend.domain.equiptech.entity;

import com.peakmate.core.audit.AuditableEntity;
import jakarta.persistence.*;
import lombok.Getter;

import java.time.LocalDate;
import java.time.LocalTime;

@Getter
@Entity
@Table(name = "equip_loss_event")
public class EquipLossEvent extends AuditableEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "id")
    private Long id;

    @Column(name = "equip_id")
    private Long equipId;

    @Column(name = "fail_date", nullable = false)
    private LocalDate failDate;

    @Column(name = "fail_time")
    private LocalTime failTime;

    @Column(name = "recovery_date")
    private LocalDate recoveryDate;

    @Column(name = "recovery_time")
    private LocalTime recoveryTime;

    @Column(name = "loss_time_min")
    private Integer lossTimeMin;

    @Column(name = "loss_type_code", length = 50)
    private String lossTypeCode;

    @Column(name = "shift_code", length = 20)
    private String shiftCode;

    @Column(name = "loss_cause", columnDefinition = "TEXT")
    private String lossCause;

    @Column(name = "loss_action", columnDefinition = "TEXT")
    private String lossAction;

    @Column(name = "remark", columnDefinition = "TEXT")
    private String remark;

    @Column(name = "is_closed", length = 1, nullable = false)
    private String isClosed = "N";

    public static EquipLossEvent create(Long equipId, LocalDate failDate, LocalTime failTime,
                                        LocalDate recoveryDate, LocalTime recoveryTime,
                                        Integer lossTimeMin, String lossTypeCode, String shiftCode,
                                        String lossCause, String lossAction, String remark,
                                        String isClosed) {
        EquipLossEvent e = new EquipLossEvent();
        e.equipId = equipId;
        e.failDate = failDate;
        e.failTime = failTime;
        e.recoveryDate = recoveryDate;
        e.recoveryTime = recoveryTime;
        e.lossTimeMin = lossTimeMin;
        e.lossTypeCode = lossTypeCode;
        e.shiftCode = shiftCode;
        e.lossCause = lossCause;
        e.lossAction = lossAction;
        e.remark = remark;
        e.isClosed = isClosed != null ? isClosed : "N";
        return e;
    }

    public void update(Long equipId, LocalDate failDate, LocalTime failTime,
                       LocalDate recoveryDate, LocalTime recoveryTime,
                       Integer lossTimeMin, String lossTypeCode, String shiftCode,
                       String lossCause, String lossAction, String remark,
                       String isClosed) {
        this.equipId = equipId;
        this.failDate = failDate;
        this.failTime = failTime;
        this.recoveryDate = recoveryDate;
        this.recoveryTime = recoveryTime;
        this.lossTimeMin = lossTimeMin;
        this.lossTypeCode = lossTypeCode;
        this.shiftCode = shiftCode;
        this.lossCause = lossCause;
        this.lossAction = lossAction;
        this.remark = remark;
        if (isClosed != null) this.isClosed = isClosed;
    }
}
