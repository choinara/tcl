package com.peakmate.backend.infra.repository.aps;

import com.peakmate.backend.domain.aps.entity.ApsScheduleDraft;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface ApsScheduleDraftJpaRepository extends JpaRepository<ApsScheduleDraft, Long> {

    List<ApsScheduleDraft> findByPlanIdOrderBySortOrderAsc(Long planId);

    List<ApsScheduleDraft> findByPlanIdAndLineCodeOrderByPlanDateAscSortOrderAsc(
            Long planId, String lineCode);

    void deleteByPlanId(Long planId);

    long countByPlanId(Long planId);
}
