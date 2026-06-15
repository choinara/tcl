package com.peakmate.backend.infra.repository.aps;

import com.peakmate.backend.domain.aps.entity.ApsScheduleLot;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface ApsScheduleLotJpaRepository extends JpaRepository<ApsScheduleLot, Long> {

    List<ApsScheduleLot> findByScheduleDraftIdOrderByIdAsc(Long scheduleDraftId);

    List<ApsScheduleLot> findByScheduleDraftIdIn(List<Long> scheduleDraftIds);

    void deleteByScheduleDraftIdIn(List<Long> scheduleDraftIds);
}
