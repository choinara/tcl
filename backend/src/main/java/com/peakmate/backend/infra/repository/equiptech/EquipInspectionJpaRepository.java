package com.peakmate.backend.infra.repository.equiptech;

import com.peakmate.backend.domain.equiptech.entity.EquipInspection;
import org.springframework.data.jpa.repository.JpaRepository;

import java.time.LocalDate;
import java.util.List;

public interface EquipInspectionJpaRepository extends JpaRepository<EquipInspection, Long> {
    List<EquipInspection> findAllByOrderByInspectDateDescIdDesc();
    List<EquipInspection> findByEquipIdAndInspectDateBetweenOrderByInspectDateDesc(
            Long equipId, LocalDate from, LocalDate to);
}
