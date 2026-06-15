package com.peakmate.backend.infra.repository.aas;

import com.peakmate.backend.domain.aas.entity.AasElement;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface AasElementJpaRepository extends JpaRepository<AasElement, Long> {
    List<AasElement> findBySubmodelId(Long submodelId);
    void deleteBySubmodelId(Long submodelId);
}
