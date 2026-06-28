package com.peakmate.backend.infra.repository.devtask;

import com.peakmate.backend.domain.devtask.entity.DevTaskSchedule;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface DevTaskScheduleJpaRepository extends JpaRepository<DevTaskSchedule, Long> {
    List<DevTaskSchedule> findAll();
}
