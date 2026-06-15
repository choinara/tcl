package com.peakmate.backend.interfaces.aas.controller;

import com.peakmate.backend.domain.aas.entity.AasLinkage;
import com.peakmate.backend.domain.aas.entity.OpcuaDataPoint;
import com.peakmate.backend.domain.aas.service.AasLinkageDomainService;
import com.peakmate.backend.domain.aas.service.OpcuaDataPointDomainService;
import com.peakmate.core.security.annotation.RequirePermission;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.media.Schema;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.*;
import java.util.stream.Collectors;

/**
 * AAS 연계 컨트롤러 (AasLinkagePage - AA0060)
 * - OPC-UA DataPoint ↔ AAS Element 연결/해제
 * - 카테고리별 연결 통계
 * - 연결 상태 기반 AAS 트리 조회
 */
@Slf4j
@RestController
@RequestMapping("/api/aas/linkage")
@RequiredArgsConstructor
@Tag(name = "AAS 연계 관리", description = "OPC-UA DataPoint ↔ AAS Element 연결/해제, 연계 통계 API")
public class AasLinkageController {

    private final AasLinkageDomainService linkageService;
    private final OpcuaDataPointDomainService dataPointService;

    /**
     * 전체 연계 상태 조회 (data points + linkage 정보)
     */
    @Operation(
            summary = "전체 연계 상태 조회",
            description = "모든 OPC-UA DataPoint와 AAS 연계 정보를 조회합니다. 카테고리별 통계와 전체 연결 현황을 포함합니다."
    )
    @ApiResponse(responseCode = "200", description = "연계 상태 조회 성공")
    @RequirePermission(menu = "AA0060", action = "read")
    @GetMapping
    public ResponseEntity<?> getLinkageStatus() {
        List<OpcuaDataPoint> allPoints = dataPointService.getAllDataPoints();
        List<AasLinkage> allLinkages = linkageService.getAllLinkages();

        // nodeId → linkage map
        Map<String, AasLinkage> linkageMap = allLinkages.stream()
                .collect(Collectors.toMap(AasLinkage::getNodeId, l -> l, (a, b) -> a));

        List<LinkagePointResponse> points = allPoints.stream().map(dp -> {
            AasLinkage lk = linkageMap.get(dp.getNodeId());
            return new LinkagePointResponse(
                    dp.getNodeId(), dp.getBrowseName(), dp.getKoreanName(),
                    dp.getCategory(), dp.getPlcAddress(), dp.getDataType(),
                    dp.getSamplingMs() != null ? dp.getSamplingMs() : 1000,
                    dp.getUnit(),
                    "Y".equals(dp.getAasLinked()),
                    dp.getAasPath(),
                    lk != null ? lk.getElementId() : null
            );
        }).toList();

        Map<String, Map<String, Long>> stats = linkageService.getStatsByCategory();

        Map<String, Object> result = new LinkedHashMap<>();
        result.put("data_points", points);
        result.put("stats", stats);
        result.put("total_linked", linkageService.countLinked());
        result.put("total_points", (long) allPoints.size());

        return ResponseEntity.ok(result);
    }

    /**
     * 카테고리별 연결 통계
     */
    @Operation(
            summary = "카테고리별 연결 통계 조회",
            description = "OPC-UA DataPoint 카테고리별 AAS 연결 통계를 조회합니다."
    )
    @ApiResponse(responseCode = "200", description = "통계 조회 성공")
    @RequirePermission(menu = "AA0060", action = "read")
    @GetMapping("/stats")
    public ResponseEntity<?> getStats() {
        Map<String, Map<String, Long>> stats = linkageService.getStatsByCategory();
        long totalLinked = linkageService.countLinked();
        return ResponseEntity.ok(Map.of("categories", stats, "total_linked", totalLinked));
    }

    /**
     * AAS 연결
     */
    @Operation(
            summary = "AAS 연결",
            description = "지정된 OPC-UA DataPoint(nodeId)를 AAS Element에 연결합니다."
    )
    @ApiResponse(responseCode = "200", description = "AAS 연결 성공")
    @ApiResponse(responseCode = "404", description = "해당 nodeId의 DataPoint를 찾을 수 없음")
    @RequirePermission(menu = "AA0060", action = "update")
    @PutMapping("/{nodeId}/link")
    public ResponseEntity<?> link(@PathVariable String nodeId,
                                  @RequestBody @Valid LinkRequest req) {
        if (dataPointService.findByNodeId(nodeId).isEmpty()) {
            return ResponseEntity.notFound().build();
        }
        AasLinkage linkage = linkageService.link(nodeId, req.element_id(), req.aas_path());
        return ResponseEntity.ok(Map.of(
                "node_id", linkage.getNodeId(),
                "element_id", linkage.getElementId(),
                "aas_path", linkage.getAasPath() != null ? linkage.getAasPath() : "",
                "linked_at", linkage.getLinkedAt().toString()
        ));
    }

    /**
     * AAS 연결 해제
     */
    @Operation(
            summary = "AAS 연결 해제",
            description = "지정된 OPC-UA DataPoint(nodeId)의 AAS 연결을 해제합니다."
    )
    @ApiResponse(responseCode = "200", description = "AAS 연결 해제 성공")
    @ApiResponse(responseCode = "404", description = "해당 nodeId의 DataPoint를 찾을 수 없음")
    @RequirePermission(menu = "AA0060", action = "update")
    @PutMapping("/{nodeId}/unlink")
    public ResponseEntity<?> unlink(@PathVariable String nodeId) {
        if (dataPointService.findByNodeId(nodeId).isEmpty()) {
            return ResponseEntity.notFound().build();
        }
        linkageService.unlink(nodeId);
        return ResponseEntity.ok(Map.of("message", "연결이 해제되었습니다.", "node_id", nodeId));
    }

    // =========================================================================
    // DTOs
    // =========================================================================

    @Schema(description = "AAS 연결 요청 DTO")
    public record LinkRequest(
            @Schema(description = "연결할 AAS Element ID", requiredMode = Schema.RequiredMode.REQUIRED, example = "1")
            @NotNull Long element_id,
            @Schema(description = "AAS 경로 (예: Submodel/Property)", example = "OperationalData/Temperature")
            String aas_path
    ) {}

    @Schema(description = "연계 포인트 응답 DTO")
    public record LinkagePointResponse(
            @Schema(description = "OPC-UA 노드 ID") String node_id,
            @Schema(description = "OPC-UA Browse 이름") String browse_name,
            @Schema(description = "한글 명칭") String korean_name,
            @Schema(description = "카테고리") String category,
            @Schema(description = "PLC 주소") String plc_address,
            @Schema(description = "데이터 타입") String data_type,
            @Schema(description = "샘플링 주기 (ms)") int sampling_ms,
            @Schema(description = "단위") String unit,
            @Schema(description = "AAS 연결 여부") boolean aas_linked,
            @Schema(description = "AAS 경로") String aas_path,
            @Schema(description = "AAS Element ID") Long element_id
    ) {}
}
