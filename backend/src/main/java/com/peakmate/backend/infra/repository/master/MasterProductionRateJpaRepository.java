package com.peakmate.backend.infra.repository.master;

import com.peakmate.backend.domain.master.entity.MasterProductionRate;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface MasterProductionRateJpaRepository extends JpaRepository<MasterProductionRate, Long> {
    List<MasterProductionRate> findAllByOrderByIdAsc();
}
