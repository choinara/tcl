package com.peakmate.backend.domain.aas.service;

import com.peakmate.backend.domain.aas.entity.AasLinkage;
import com.peakmate.backend.domain.aas.entity.OpcuaDataPoint;
import com.peakmate.backend.infra.repository.aas.AasLinkageJpaRepository;
import com.peakmate.backend.infra.repository.aas.OpcuaDataPointJpaRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.stream.Collectors;

/**
 * AAS 연계 도메인 서비스
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class AasLinkageDomainService {

    private final AasLinkageJpaRepository linkageRepository;
    private final OpcuaDataPointJpaRepository dataPointRepository;

    @Transactional(readOnly = true)
    public List<AasLinkage> getAllLinkages() {
        return linkageRepository.findAll();
    }

    @Transactional(readOnly = true)
    public Optional<AasLinkage> findByNodeId(String nodeId) {
        return linkageRepository.findByNodeId(nodeId);
    }

    @Transactional
    public AasLinkage link(String nodeId, Long elementId, String aasPath) {
        // 이미 연결된 경우 삭제 후 재생성
        linkageRepository.findByNodeId(nodeId).ifPresent(existing ->
                linkageRepository.deleteByNodeId(nodeId));

        AasLinkage linkage = AasLinkage.create(nodeId, elementId, aasPath);
        AasLinkage saved = linkageRepository.save(linkage);

        // opcua_data_point의 aas_linked, aas_path 업데이트
        dataPointRepository.findByNodeId(nodeId).ifPresent(dp -> {
            dp.linkToAas(aasPath);
            dataPointRepository.save(dp);
        });

        log.debug("[AAS 연결] nodeId={}, elementId={}, aasPath={}", nodeId, elementId, aasPath);
        return saved;
    }

    @Transactional
    public void unlink(String nodeId) {
        linkageRepository.deleteByNodeId(nodeId);

        dataPointRepository.findByNodeId(nodeId).ifPresent(dp -> {
            dp.unlinkFromAas();
            dataPointRepository.save(dp);
        });

        log.debug("[AAS 연결해제] nodeId={}", nodeId);
    }

    @Transactional(readOnly = true)
    public long countLinked() {
        return linkageRepository.count();
    }

    /**
     * 카테고리별 연결 통계
     */
    @Transactional(readOnly = true)
    public Map<String, Map<String, Long>> getStatsByCategory() {
        List<OpcuaDataPoint> allPoints = dataPointRepository
                .findByUseYnOrderByCategoryAscBrowseNameAsc("Y");

        return allPoints.stream()
                .filter(dp -> dp.getCategory() != null)
                .collect(Collectors.groupingBy(
                        OpcuaDataPoint::getCategory,
                        Collectors.collectingAndThen(
                                Collectors.toList(),
                                list -> {
                                    long total = list.size();
                                    long linked = list.stream()
                                            .filter(dp -> "Y".equals(dp.getAasLinked()))
                                            .count();
                                    return Map.of("total", total, "linked", linked);
                                }
                        )
                ));
    }
}
