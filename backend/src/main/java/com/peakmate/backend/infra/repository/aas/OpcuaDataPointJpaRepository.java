package com.peakmate.backend.infra.repository.aas;

import com.peakmate.backend.domain.aas.entity.OpcuaDataPoint;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface OpcuaDataPointJpaRepository extends JpaRepository<OpcuaDataPoint, Long> {
    Optional<OpcuaDataPoint> findByNodeId(String nodeId);
    List<OpcuaDataPoint> findByUseYnOrderByCategoryAscBrowseNameAsc(String useYn);
    List<OpcuaDataPoint> findByCategoryAndUseYnOrderByBrowseNameAsc(String category, String useYn);
    List<OpcuaDataPoint> findByIsPublishedAndUseYnOrderByCategoryAsc(String isPublished, String useYn);
    List<OpcuaDataPoint> findByAasLinkedAndUseYn(String aasLinked, String useYn);
    List<OpcuaDataPoint> findByAssetInstanceIdAndUseYnOrderByCategoryAscBrowseNameAsc(Long assetInstanceId, String useYn);
    List<OpcuaDataPoint> findByAssetInstanceIdAndCategoryAndUseYnOrderByBrowseNameAsc(Long assetInstanceId, String category, String useYn);
    List<OpcuaDataPoint> findBySourceIdAndUseYnOrderByCategoryAscBrowseNameAsc(String sourceId, String useYn);
    long countBySourceIdAndUseYn(String sourceId, String useYn);
    void deleteByNodeId(String nodeId);
    long countByCategory(String category);
    long countByAasLinked(String aasLinked);
    long countByIsActive(String isActive);
}
