package com.peakmate.backend.domain.equiptech.entity;

import com.peakmate.core.audit.AuditableEntity;
import jakarta.persistence.*;
import lombok.Getter;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalTime;

@Getter
@Entity
@Table(name = "equip_operation_plan")
public class EquipOperationPlan extends AuditableEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "id")
    private Long id;

    @Column(name = "equip_id")
    private Long equipId;

    @Column(name = "plan_date", nullable = false)
    private LocalDate planDate;

    @Column(name = "event_type_code", length = 30)
    private String eventTypeCode;

    @Column(name = "event_content", length = 200)
    private String eventContent;

    @Column(name = "std_time_h", precision = 5, scale = 2)
    private BigDecimal stdTimeH;

    @Column(name = "start_time")
    private LocalTime startTime;

    @Column(name = "end_time")
    private LocalTime endTime;

    @Column(name = "avail_time_h", precision = 5, scale = 2)
    private BigDecimal availTimeH;

    @Column(name = "remark", columnDefinition = "TEXT")
    private String remark;

    public static EquipOperationPlan create(Long equipId, LocalDate planDate,
                                            String eventTypeCode, String eventContent,
                                            BigDecimal stdTimeH, LocalTime startTime, LocalTime endTime,
                                            BigDecimal availTimeH, String remark) {
        EquipOperationPlan e = new EquipOperationPlan();
        e.equipId = equipId;
        e.planDate = planDate;
        e.eventTypeCode = eventTypeCode;
        e.eventContent = eventContent;
        e.stdTimeH = stdTimeH;
        e.startTime = startTime;
        e.endTime = endTime;
        e.availTimeH = availTimeH;
        e.remark = remark;
        return e;
    }

    public void update(Long equipId, LocalDate planDate,
                       String eventTypeCode, String eventContent,
                       BigDecimal stdTimeH, LocalTime startTime, LocalTime endTime,
                       BigDecimal availTimeH, String remark) {
        this.equipId = equipId;
        this.planDate = planDate;
        this.eventTypeCode = eventTypeCode;
        this.eventContent = eventContent;
        this.stdTimeH = stdTimeH;
        this.startTime = startTime;
        this.endTime = endTime;
        this.availTimeH = availTimeH;
        this.remark = remark;
    }
}
