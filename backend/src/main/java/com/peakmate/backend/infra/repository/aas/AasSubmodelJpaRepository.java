package com.peakmate.backend.infra.repository.aas;

import com.peakmate.backend.domain.aas.entity.AasSubmodel;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface AasSubmodelJpaRepository extends JpaRepository<AasSubmodel, Long> {
    List<AasSubmodel> findByShellId(Long shellId);
    void deleteByShellId(Long shellId);
}
