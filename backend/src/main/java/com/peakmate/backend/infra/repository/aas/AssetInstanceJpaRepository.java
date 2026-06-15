package com.peakmate.backend.infra.repository.aas;

import com.peakmate.backend.domain.aas.entity.AssetInstance;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface AssetInstanceJpaRepository extends JpaRepository<AssetInstance, Long> {
    Optional<AssetInstance> findByInstanceId(String instanceId);
    List<AssetInstance> findByTypeCodeAndUseYnOrderByCreatedAtAsc(String typeCode, String useYn);
    List<AssetInstance> findByUseYnOrderByCreatedAtAsc(String useYn);
    void deleteByInstanceId(String instanceId);
    long countByTypeCode(String typeCode);
}
