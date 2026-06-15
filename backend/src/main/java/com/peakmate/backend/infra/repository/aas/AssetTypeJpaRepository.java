package com.peakmate.backend.infra.repository.aas;

import com.peakmate.backend.domain.aas.entity.AssetType;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface AssetTypeJpaRepository extends JpaRepository<AssetType, Long> {
    Optional<AssetType> findByTypeCode(String typeCode);
    List<AssetType> findByUseYnOrderByCreatedAtAsc(String useYn);
    void deleteByTypeCode(String typeCode);
}
