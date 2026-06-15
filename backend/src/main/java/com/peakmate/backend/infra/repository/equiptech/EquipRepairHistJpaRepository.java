package com.peakmate.backend.infra.repository.equiptech;

import com.peakmate.backend.domain.equiptech.entity.EquipRepairHist;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface EquipRepairHistJpaRepository extends JpaRepository<EquipRepairHist, Long> {
    List<EquipRepairHist> findAllByOrderByIdDesc();
    Optional<EquipRepairHist> findByRepairNo(String repairNo);
    List<EquipRepairHist> findByEquipIdOrderByIdDesc(Long equipId);
}
