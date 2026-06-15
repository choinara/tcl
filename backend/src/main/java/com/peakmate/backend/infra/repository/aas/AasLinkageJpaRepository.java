package com.peakmate.backend.infra.repository.aas;

import com.peakmate.backend.domain.aas.entity.AasLinkage;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface AasLinkageJpaRepository extends JpaRepository<AasLinkage, Long> {
    Optional<AasLinkage> findByNodeId(String nodeId);
    List<AasLinkage> findByElementId(Long elementId);
    void deleteByNodeId(String nodeId);
    long count();
}
