package com.peakmate.backend.infra.repository.aas;

import com.peakmate.backend.domain.aas.entity.DataSource;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface DataSourceJpaRepository extends JpaRepository<DataSource, Long> {
    Optional<DataSource> findBySourceId(String sourceId);
    List<DataSource> findByUseYnOrderByCreatedAtAsc(String useYn);
    List<DataSource> findByAssetInstanceIdAndUseYnOrderBySourceNameAsc(Long assetInstanceId, String useYn);
    void deleteBySourceId(String sourceId);
}
