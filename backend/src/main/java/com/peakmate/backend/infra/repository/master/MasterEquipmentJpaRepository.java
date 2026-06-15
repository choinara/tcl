package com.peakmate.backend.infra.repository.master;

import com.peakmate.backend.domain.master.entity.MasterEquipment;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface MasterEquipmentJpaRepository extends JpaRepository<MasterEquipment, Long> {
    List<MasterEquipment> findAllByOrderByIdAsc();
    Optional<MasterEquipment> findByUnitNumberAndLineName(String unitNumber, String lineName);
    Optional<MasterEquipment> findByEquipCode(String equipCode);
}
