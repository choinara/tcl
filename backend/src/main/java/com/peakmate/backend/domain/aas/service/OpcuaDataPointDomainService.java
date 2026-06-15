package com.peakmate.backend.domain.aas.service;

import com.peakmate.backend.domain.aas.dto.CsvImportResult;
import com.peakmate.backend.domain.aas.dto.CsvImportResult.CsvErrorEntry;
import com.peakmate.backend.domain.aas.entity.AssetInstance;
import com.peakmate.backend.domain.aas.entity.DataSource;
import com.peakmate.backend.domain.aas.entity.OpcuaDataPoint;
import com.peakmate.backend.infra.repository.aas.AssetInstanceJpaRepository;
import com.peakmate.backend.infra.repository.aas.DataSourceJpaRepository;
import com.peakmate.backend.infra.repository.aas.OpcuaDataPointJpaRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import java.io.BufferedReader;
import java.io.InputStreamReader;
import java.nio.charset.StandardCharsets;
import java.util.*;
import java.util.stream.Collectors;

/**
 * OPC-UA 데이터 포인트 도메인 서비스
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class OpcuaDataPointDomainService {

    private final DataSourceJpaRepository dataSourceJpaRepository;
    private final OpcuaDataPointJpaRepository opcuaDataPointJpaRepository;
    private final AssetInstanceJpaRepository assetInstanceJpaRepository;

    // =========================================================================
    // Data Source
    // =========================================================================

    @Transactional(readOnly = true)
    public List<DataSource> getAllDataSources() {
        return dataSourceJpaRepository.findByUseYnOrderByCreatedAtAsc("Y");
    }

    @Transactional(readOnly = true)
    public List<DataSource> getDataSourcesByInstance(Long instanceId) {
        return dataSourceJpaRepository.findByAssetInstanceIdAndUseYnOrderBySourceNameAsc(instanceId, "Y");
    }

    @Transactional(readOnly = true)
    public Optional<DataSource> findDataSourceById(String sourceId) {
        return dataSourceJpaRepository.findBySourceId(sourceId);
    }

    @Transactional
    public DataSource saveDataSource(DataSource ds) {
        return dataSourceJpaRepository.save(ds);
    }

    @Transactional
    public void deleteDataSource(String sourceId) {
        log.debug("[DataSource 삭제] sourceId={}", sourceId);
        dataSourceJpaRepository.deleteBySourceId(sourceId);
    }

    // =========================================================================
    // OPC-UA Data Point (Collection Item + Mapping + Node)
    // =========================================================================

    @Transactional(readOnly = true)
    public List<OpcuaDataPoint> getAllDataPoints() {
        return opcuaDataPointJpaRepository.findByUseYnOrderByCategoryAscBrowseNameAsc("Y");
    }

    @Transactional(readOnly = true)
    public List<OpcuaDataPoint> getDataPointsByInstance(Long instanceId) {
        return opcuaDataPointJpaRepository
                .findByAssetInstanceIdAndUseYnOrderByCategoryAscBrowseNameAsc(instanceId, "Y");
    }

    @Transactional(readOnly = true)
    public List<OpcuaDataPoint> getDataPointsBySource(String sourceId) {
        return opcuaDataPointJpaRepository
                .findBySourceIdAndUseYnOrderByCategoryAscBrowseNameAsc(sourceId, "Y");
    }

    @Transactional(readOnly = true)
    public long countDataPointsBySourceId(String sourceId) {
        return opcuaDataPointJpaRepository.countBySourceIdAndUseYn(sourceId, "Y");
    }

    /**
     * source_id와 asset_instance_id 계층 일관성 검증.
     * DataSource가 속한 인스턴스와 요청 인스턴스가 불일치하면 IllegalArgumentException.
     */
    public void validateSourceHierarchy(String sourceId, Long assetInstanceId) {
        if (sourceId == null) return;
        DataSource ds = dataSourceJpaRepository.findBySourceId(sourceId)
                .orElseThrow(() -> new IllegalArgumentException("존재하지 않는 소스 ID: " + sourceId));
        if (assetInstanceId != null && ds.getAssetInstanceId() != null
                && !ds.getAssetInstanceId().equals(assetInstanceId)) {
            throw new IllegalArgumentException(
                    "소스(" + sourceId + ")가 속한 인스턴스(" + ds.getAssetInstanceId() +
                    ")와 요청 인스턴스(" + assetInstanceId + ")가 일치하지 않습니다.");
        }
    }

    /**
     * assetInstanceId로 AssetInstance 조회하여 instanceName을 반환 (캐시 갱신용).
     */
    public String resolveAssetInstanceName(Long assetInstanceId) {
        if (assetInstanceId == null) return null;
        return assetInstanceJpaRepository.findById(assetInstanceId)
                .map(AssetInstance::getInstanceName)
                .orElse(null);
    }

    @Transactional(readOnly = true)
    public List<OpcuaDataPoint> getPublishedNodes() {
        return opcuaDataPointJpaRepository.findByIsPublishedAndUseYnOrderByCategoryAsc("Y", "Y");
    }

    @Transactional(readOnly = true)
    public Optional<OpcuaDataPoint> findByNodeId(String nodeId) {
        return opcuaDataPointJpaRepository.findByNodeId(nodeId);
    }

    @Transactional
    public OpcuaDataPoint saveDataPoint(OpcuaDataPoint dp) {
        return opcuaDataPointJpaRepository.save(dp);
    }

    @Transactional
    public void deleteDataPoint(String nodeId) {
        log.debug("[DataPoint 삭제] nodeId={}", nodeId);
        opcuaDataPointJpaRepository.deleteByNodeId(nodeId);
    }

    /**
     * 수집 항목 기반으로 OPC-UA 노드 생성 (isPublished = Y로 설정)
     */
    @Transactional
    public int generateNodes() {
        List<OpcuaDataPoint> points = opcuaDataPointJpaRepository
                .findByUseYnOrderByCategoryAscBrowseNameAsc("Y");
        int count = 0;
        for (OpcuaDataPoint dp : points) {
            if ("Y".equals(dp.getIsActive()) && !"Y".equals(dp.getIsPublished())) {
                dp.publishAsNode();
                opcuaDataPointJpaRepository.save(dp);
                count++;
            }
        }
        log.debug("[OPC-UA 노드 생성] {}개 노드 생성됨", count);
        return count;
    }

    @Transactional(readOnly = true)
    public long countByCategory(String category) {
        return opcuaDataPointJpaRepository.countByCategory(category);
    }

    @Transactional(readOnly = true)
    public long countLinked() {
        return opcuaDataPointJpaRepository.countByAasLinked("Y");
    }

    @Transactional(readOnly = true)
    public long countActive() {
        return opcuaDataPointJpaRepository.countByIsActive("Y");
    }

    // =========================================================================
    // Engineering CSV Import
    // =========================================================================

    @Transactional
    public CsvImportResult importFromCsv(MultipartFile file, Long instanceId) throws Exception {
        try (BufferedReader reader = new BufferedReader(
                new InputStreamReader(file.getInputStream(), StandardCharsets.UTF_8))) {

            String headerLine = reader.readLine();
            if (headerLine == null) {
                throw new IllegalArgumentException("CSV 파일이 비어있습니다.");
            }
            if (headerLine.startsWith("﻿")) {
                headerLine = headerLine.substring(1);
            }

            String[] rawHeaders = headerLine.split(",");
            Map<String, Integer> headerMap = new LinkedHashMap<>();
            for (int i = 0; i < rawHeaders.length; i++) {
                headerMap.put(normalizeHeader(rawHeaders[i].trim()), i);
            }

            List<String[]> csvRows = new ArrayList<>();
            String line;
            while ((line = reader.readLine()) != null) {
                if (!line.isBlank()) csvRows.add(line.split(",", -1));
            }

            if (csvRows.isEmpty()) {
                throw new IllegalArgumentException("CSV 데이터 행이 없습니다.");
            }

            Map<String, Long> equipNameToInstanceId = assetInstanceJpaRepository.findAll().stream()
                    .collect(Collectors.toMap(
                            a -> a.getInstanceName().trim(),
                            AssetInstance::getId,
                            (existing, dupe) -> existing
                    ));

            int insertCount = 0;
            int updateCount = 0;
            List<CsvErrorEntry> errors = new ArrayList<>();
            Set<String> unmatchedEquipNames = new LinkedHashSet<>();

            for (int rowIdx = 0; rowIdx < csvRows.size(); rowIdx++) {
                try {
                    String[] cols = csvRows.get(rowIdx);
                    String aasPropertyId = getCol(cols, headerMap, "aas_propertyidentifier");
                    String edgeName = getCol(cols, headerMap, "edgename");
                    String equipName = getCol(cols, headerMap, "equipmentname");
                    String rawNodeId = getCol(cols, headerMap, "fielddataidentifier");
                    String samplingStr = getCol(cols, headerMap, "sampling");
                    String arrayIdxStr = getCol(cols, headerMap, "arrayindex");

                    if (rawNodeId == null || rawNodeId.isBlank()) {
                        errors.add(new CsvErrorEntry(rowIdx + 2, "NodeID(FieldDataIdentifier) 값이 비어있습니다."));
                        continue;
                    }

                    String nodeId = equipName != null
                            ? rawNodeId.replace("EQUIP-NAME", equipName.trim())
                            : rawNodeId;

                    String category = extractCategory(aasPropertyId);
                    Integer samplingMs = parseIntOrDefault(samplingStr, 1000);
                    Integer arrayIndex = parseIntOrDefault(arrayIdxStr, -1);

                    Long resolvedInstanceId;
                    if (instanceId != null) {
                        resolvedInstanceId = instanceId;
                    } else if (equipName != null) {
                        resolvedInstanceId = equipNameToInstanceId.get(equipName.trim());
                        if (resolvedInstanceId == null) {
                            unmatchedEquipNames.add(equipName.trim());
                        }
                    } else {
                        resolvedInstanceId = null;
                    }

                    Optional<OpcuaDataPoint> existing = opcuaDataPointJpaRepository.findByNodeId(nodeId);
                    if (existing.isPresent()) {
                        existing.get().updateFromCsv(aasPropertyId, edgeName, equipName,
                                samplingMs, arrayIndex, resolvedInstanceId);
                        opcuaDataPointJpaRepository.save(existing.get());
                        updateCount++;
                    } else {
                        String browseName = extractBrowseName(aasPropertyId, nodeId);
                        opcuaDataPointJpaRepository.save(OpcuaDataPoint.create(
                                nodeId, browseName, equipName, null, category, null, null,
                                samplingMs, "OPC_UA", null, aasPropertyId, null, true,
                                resolvedInstanceId, edgeName, equipName, arrayIndex,
                                null, null, null,
                                null  // sourceId — CSV import 시 미지정 (다음 버전에서 CSV 컬럼 인식 추가)
                        ));
                        insertCount++;
                    }
                } catch (Exception e) {
                    errors.add(new CsvErrorEntry(rowIdx + 2, e.getMessage()));
                }
            }

            log.info("[CSV Import] inserted={}, updated={}, errors={}, total={}",
                    insertCount, updateCount, errors.size(), csvRows.size());
            return new CsvImportResult(insertCount, updateCount, errors, new ArrayList<>(unmatchedEquipNames));
        }
    }

    private String normalizeHeader(String h) {
        return h.replaceAll("\\(.*?\\)", "")
                .replaceAll("[^a-zA-Z0-9_]", "")
                .toLowerCase();
    }

    private String getCol(String[] cols, Map<String, Integer> headerMap, String key) {
        Integer idx = headerMap.get(key);
        if (idx == null || idx >= cols.length) return null;
        String val = cols[idx].trim();
        return val.isEmpty() ? null : val;
    }

    private Integer parseIntOrDefault(String value, int defaultValue) {
        if (value == null || value.isBlank()) return defaultValue;
        try {
            return Integer.parseInt(value.trim());
        } catch (NumberFormatException e) {
            return defaultValue;
        }
    }

    private String extractBrowseName(String aasPropertyId, String nodeId) {
        if (aasPropertyId != null && aasPropertyId.contains(":")) {
            return aasPropertyId.substring(aasPropertyId.lastIndexOf(':') + 1);
        }
        if (nodeId.contains("/")) {
            return nodeId.substring(nodeId.lastIndexOf('/') + 1);
        }
        return nodeId;
    }

    // =========================================================================
    // Category Extraction (engineering CSV → 5-category)
    // =========================================================================

    private static final Set<String> VALID_CATEGORIES = Set.of(
            "Temperature", "Time", "Vision", "VisionNG", "Pressure"
    );

    /**
     * AAS_PropertyIdentifier에서 카테고리를 추출한다.
     * 형식 예: /OperationalData/Temperature:1stMLeftUp → "Temperature"
     *         /OperationalData/VisionNG:FilmOverlap → "VisionNG"
     */
    public String extractCategory(String aasPropertyIdentifier) {
        if (aasPropertyIdentifier == null || aasPropertyIdentifier.isBlank()) {
            return "Unknown";
        }
        String pathPart = aasPropertyIdentifier.split(":")[0];
        String[] segments = pathPart.split("/");
        for (String seg : segments) {
            if (VALID_CATEGORIES.contains(seg)) {
                return seg;
            }
        }
        // 폴백: ":" 앞 마지막 세그먼트 반환
        return segments[segments.length - 1];
    }
}
