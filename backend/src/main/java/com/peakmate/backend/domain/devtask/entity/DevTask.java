package com.peakmate.backend.domain.devtask.entity;

import com.peakmate.core.audit.AuditableEntity;
import jakarta.persistence.*;
import lombok.AccessLevel;
import lombok.Getter;
import lombok.NoArgsConstructor;

import java.time.LocalDate;

@Entity
@Table(name = "dev_task")
@Getter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
public class DevTask extends AuditableEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "seq_id")
    private Long id;

    @Column(name = "task_code", nullable = false, unique = true, length = 10)
    private String taskCode;

    @Column(name = "original_no", length = 10)
    private String originalNo;

    @Column(name = "task_name", nullable = false, length = 500)
    private String taskName;

    @Column(name = "task_group", nullable = false, length = 50)
    private String taskGroup;

    @Column(name = "dev_type", nullable = false, length = 50)
    private String devType;

    @Column(name = "priority", nullable = false, length = 10)
    private String priority;

    @Column(name = "status", nullable = false, length = 20)
    private String status;

    @Column(name = "phase", length = 20)
    private String phase;

    @Column(name = "proposer", length = 100)
    private String proposer;

    @Column(name = "assignee", length = 100)
    private String assignee;

    @Column(name = "related_menu_code", length = 20)
    private String relatedMenuCode;

    @Column(name = "description", columnDefinition = "TEXT")
    private String description;

    @Column(name = "completion_criteria", columnDefinition = "TEXT")
    private String completionCriteria;

    @Column(name = "planned_start", length = 10)
    private String plannedStart;

    @Column(name = "planned_end", length = 10)
    private String plannedEnd;

    @Column(name = "actual_start_date")
    private LocalDate actualStartDate;

    @Column(name = "actual_end_date")
    private LocalDate actualEndDate;

    @Column(name = "progress", nullable = false)
    private Integer progress;

    @Column(name = "remarks", columnDefinition = "TEXT")
    private String remarks;

    @Column(name = "use_yn", nullable = false, length = 1)
    private String useYn;

    public static DevTask create(String taskCode, String originalNo, String taskName,
            String taskGroup, String devType, String priority, String status,
            String phase, String proposer) {
        DevTask t = new DevTask();
        t.taskCode = taskCode;
        t.originalNo = originalNo;
        t.taskName = taskName;
        t.taskGroup = taskGroup;
        t.devType = devType;
        t.priority = priority;
        t.status = status;
        t.phase = phase;
        t.proposer = proposer;
        t.progress = 0;
        t.useYn = "Y";
        return t;
    }

    public void update(String taskName, String taskGroup, String devType,
            String priority, String status, String phase, String assignee,
            String relatedMenuCode, String description, String completionCriteria,
            String plannedStart, String plannedEnd,
            LocalDate actualStartDate, LocalDate actualEndDate,
            Integer progress, String remarks, String useYn) {
        this.taskName = taskName;
        this.taskGroup = taskGroup;
        this.devType = devType;
        this.priority = priority;
        this.status = status;
        this.phase = phase;
        this.assignee = assignee;
        this.relatedMenuCode = relatedMenuCode;
        this.description = description;
        this.completionCriteria = completionCriteria;
        this.plannedStart = plannedStart;
        this.plannedEnd = plannedEnd;
        this.actualStartDate = actualStartDate;
        this.actualEndDate = actualEndDate;
        this.progress = progress;
        this.remarks = remarks;
        this.useYn = useYn;
    }
}
