package com.peakmate.backend.infra.repository.master;

import com.peakmate.backend.domain.master.entity.MasterQualityStandard;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface MasterQualityStandardJpaRepository extends JpaRepository<MasterQualityStandard, Long> {
    List<MasterQualityStandard> findAllByOrderByIdAsc();
}
