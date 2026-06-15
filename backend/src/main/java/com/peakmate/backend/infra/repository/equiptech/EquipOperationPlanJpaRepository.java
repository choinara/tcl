package com.peakmate.backend.infra.repository.equiptech;

import com.peakmate.backend.domain.equiptech.entity.EquipOperationPlan;
import org.springframework.data.jpa.repository.JpaRepository;

import java.time.LocalDate;
import java.util.List;

public interface EquipOperationPlanJpaRepository extends JpaRepository<EquipOperationPlan, Long> {

    List<EquipOperationPlan> findByPlanDateBetweenOrderByEquipIdAscPlanDateAsc(
            LocalDate start, LocalDate end);
}
