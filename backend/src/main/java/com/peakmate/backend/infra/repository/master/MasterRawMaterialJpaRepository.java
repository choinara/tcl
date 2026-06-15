package com.peakmate.backend.infra.repository.master;

import com.peakmate.backend.domain.master.entity.MasterRawMaterial;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface MasterRawMaterialJpaRepository extends JpaRepository<MasterRawMaterial, Long> {
    List<MasterRawMaterial> findAllByOrderByIdAsc();
    Optional<MasterRawMaterial> findByMaterialCode(String materialCode);
}
