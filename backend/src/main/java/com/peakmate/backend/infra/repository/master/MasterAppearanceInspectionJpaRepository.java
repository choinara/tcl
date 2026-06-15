package com.peakmate.backend.infra.repository.master;

import com.peakmate.backend.domain.master.entity.MasterAppearanceInspection;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface MasterAppearanceInspectionJpaRepository extends JpaRepository<MasterAppearanceInspection, Long> {
    List<MasterAppearanceInspection> findAllByOrderByIdAsc();
}
