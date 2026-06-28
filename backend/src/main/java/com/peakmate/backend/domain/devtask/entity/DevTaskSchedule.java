package com.peakmate.backend.domain.devtask.entity;

import jakarta.persistence.*;
import lombok.AccessLevel;
import lombok.Getter;
import lombok.NoArgsConstructor;

import java.time.LocalDate;

@Entity
@Table(name = "dev_task_schedule",
    uniqueConstraints = @UniqueConstraint(name = "uq_dev_task_schedule", columnNames = {"task_code", "stage_code"}))
@Getter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
public class DevTaskSchedule {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "task_code", nullable = false, length = 10)
    private String taskCode;

    @Column(name = "stage_code", nullable = false, length = 20)
    private String stageCode;

    @Column(name = "stage_start")
    private LocalDate stageStart;

    @Column(name = "stage_end")
    private LocalDate stageEnd;
}
