package com.peakmate.backend.infra.repository.master;

import com.peakmate.backend.domain.master.entity.MasterQualitySpec;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface MasterQualitySpecJpaRepository extends JpaRepository<MasterQualitySpec, Long> {
    List<MasterQualitySpec> findAllByOrderByIdAsc();
}
