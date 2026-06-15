package com.peakmate.backend.infra.repository.aas;

import com.peakmate.backend.domain.aas.entity.CollectedData;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface CollectedDataJpaRepository extends JpaRepository<CollectedData, Long> {
    List<CollectedData> findTop200ByOrderByCollectedAtDesc();
    List<CollectedData> findTop200ByNodeIdOrderByCollectedAtDesc(String nodeId);
}
