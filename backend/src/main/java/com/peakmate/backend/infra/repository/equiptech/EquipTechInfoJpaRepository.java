package com.peakmate.backend.infra.repository.equiptech;

import com.peakmate.backend.domain.equiptech.entity.EquipTechInfo;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface EquipTechInfoJpaRepository extends JpaRepository<EquipTechInfo, Long> {
    List<EquipTechInfo> findAllByOrderByEquipCategoryCode();
    Optional<EquipTechInfo> findByEquipCategoryCode(String equipCategoryCode);
}
