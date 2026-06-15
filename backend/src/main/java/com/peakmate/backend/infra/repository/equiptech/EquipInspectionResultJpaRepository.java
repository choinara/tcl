package com.peakmate.backend.infra.repository.equiptech;

import com.peakmate.backend.domain.equiptech.entity.EquipInspectionResult;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface EquipInspectionResultJpaRepository extends JpaRepository<EquipInspectionResult, Long> {
    List<EquipInspectionResult> findByInspectionIdOrderByItemNo(Long inspectionId);
    void deleteByInspectionId(Long inspectionId);
}
