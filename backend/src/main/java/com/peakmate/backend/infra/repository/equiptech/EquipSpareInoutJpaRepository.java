package com.peakmate.backend.infra.repository.equiptech;

import com.peakmate.backend.domain.equiptech.entity.EquipSpareInout;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface EquipSpareInoutJpaRepository extends JpaRepository<EquipSpareInout, Long> {
    List<EquipSpareInout> findBySpareIdOrderByInoutDateDescIdDesc(Long spareId);
}
