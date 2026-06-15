package com.peakmate.backend.infra.repository.aps;

import com.peakmate.backend.domain.aps.entity.ApsPlan;
import org.springframework.data.jpa.repository.JpaRepository;

import java.time.LocalDate;
import java.util.List;

public interface ApsPlanJpaRepository extends JpaRepository<ApsPlan, Long> {

    List<ApsPlan> findByStatusOrderByCreatedAtDesc(String status);

    List<ApsPlan> findByPeriodStartBetweenOrderByCreatedAtDesc(LocalDate from, LocalDate to);
}
