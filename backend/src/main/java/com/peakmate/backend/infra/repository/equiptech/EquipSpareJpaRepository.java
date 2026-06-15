package com.peakmate.backend.infra.repository.equiptech;

import com.peakmate.backend.domain.equiptech.entity.EquipSpare;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface EquipSpareJpaRepository extends JpaRepository<EquipSpare, Long> {
    List<EquipSpare> findAllByOrderByIdAsc();
    Optional<EquipSpare> findBySpareCode(String spareCode);
}
