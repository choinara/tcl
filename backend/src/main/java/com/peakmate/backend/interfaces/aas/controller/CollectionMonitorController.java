package com.peakmate.backend.interfaces.aas.controller;

import com.peakmate.backend.domain.aas.entity.CollectedData;
import com.peakmate.backend.domain.aas.entity.CollectionChannel;
import com.peakmate.backend.domain.aas.entity.OpcuaDataPoint;
import com.peakmate.backend.domain.aas.service.CollectionMonitorDomainService;
import com.peakmate.backend.domain.aas.service.OpcuaDataPointDomainService;
import com.peakmate.core.security.annotation.RequirePermission;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.media.Schema;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.*;
import java.util.stream.Collectors;

/**
 * 수집 모니터링 컨트롤러 (AasMonitorPage - AA0080)
 * - 채널 목록/토글
 * - 장비별 수집 상태
 * - 최근 수집 데이터 조회
 */
@Slf4j
@RestController
@RequestMapping("/api/opcua")
@RequiredArgsConstructor
@Tag(name = "수집 모니터링", description = "수집 채널, 수집 상태, 실시간 수집 데이터 모니터링 API")
public class CollectionMonitorController {

    private final CollectionMonitorDomainService monitorService;
    private final OpcuaDataPointDomainService dataPointService;

    // =========================================================================
    // Channels
    // =========================================================================

    /**
     * 채널 목록 조회
     */
    @Operation(summary = "수집 채널 목록 조회", description = "등록된 모든 OPC-UA 수집 채널의 목록을 조회한다.")
    @ApiResponse(responseCode = "200", description = "채널 목록 조회 성공")
    @RequirePermission(menu = "AA0080", action = "read")
    @GetMapping("/channels")
    public ResponseEntity<List<ChannelResponse>> getChannels() {
        List<CollectionChannel> channels = monitorService.getAllChannels();
        return ResponseEntity.ok(channels.stream().map(ChannelResponse::from).toList());
    }

    /**
     * 채널 활성/비활성 토글
     */
    @Operation(summary = "수집 채널 활성/비활성 토글", description = "지정된 채널의 활성 상태를 반전시킨다. (활성 -> 비활성, 비활성 -> 활성)")
    @ApiResponse(responseCode = "200", description = "채널 토글 성공")
    @ApiResponse(responseCode = "404", description = "채널을 찾을 수 없음")
    @RequirePermission(menu = "AA0080", action = "update")
    @PutMapping("/channels/{channelId}/toggle")
    public ResponseEntity<?> toggleChannel(@PathVariable String channelId) {
        try {
            CollectionChannel ch = monitorService.toggleChannel(channelId);
            return ResponseEntity.ok(ChannelResponse.from(ch));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.notFound().build();
        }
    }

    // =========================================================================
    // Collection Status (장비별)
    // =========================================================================

    /**
     * 장비(카테고리)별 수집 상태
     */
    @Operation(summary = "장비별 수집 상태 조회", description = "장비(카테고리)별 수집 연결 상태, 최근 수집 시각, 에러 건수를 조회한다.")
    @ApiResponse(responseCode = "200", description = "수집 상태 조회 성공")
    @RequirePermission(menu = "AA0080", action = "read")
    @GetMapping("/collection-status")
    public ResponseEntity<List<CollectionStatusResponse>> getCollectionStatus() {
        List<OpcuaDataPoint> allPoints = dataPointService.getAllDataPoints();

        // 카테고리별 집계
        Map<String, List<OpcuaDataPoint>> byCategory = allPoints.stream()
                .filter(dp -> dp.getCategory() != null)
                .collect(Collectors.groupingBy(OpcuaDataPoint::getCategory));

        List<CollectionStatusResponse> statuses = byCategory.entrySet().stream()
                .map(entry -> {
                    String cat = entry.getKey();
                    List<OpcuaDataPoint> points = entry.getValue();
                    long activeCount = points.stream()
                            .filter(dp -> "Y".equals(dp.getIsActive()))
                            .count();
                    // 최근 업데이트 시간 가져오기
                    String lastCollected = points.stream()
                            .filter(dp -> dp.getLastUpdated() != null)
                            .map(dp -> dp.getLastUpdated().toString())
                            .max(String::compareTo)
                            .orElse(null);

                    return new CollectionStatusResponse(
                            cat, cat, activeCount > 0, lastCollected, 0
                    );
                })
                .sorted(Comparator.comparing(CollectionStatusResponse::instance_id))
                .toList();

        return ResponseEntity.ok(statuses);
    }

    // =========================================================================
    // Collected Data
    // =========================================================================

    /**
     * 최근 수집 데이터 조회
     */
    @Operation(summary = "최근 수집 데이터 조회", description = "최근 수집된 OPC-UA 데이터 목록을 조회한다. AAS 경로, PLC 주소, 카테고리, 단위 정보를 포함한다.")
    @ApiResponse(responseCode = "200", description = "수집 데이터 조회 성공")
    @RequirePermission(menu = "AA0080", action = "read")
    @GetMapping("/collected-data")
    public ResponseEntity<List<CollectedDataResponse>> getCollectedData() {
        List<CollectedData> data = monitorService.getRecentData();

        // node_id → OpcuaDataPoint 매핑 (aas_path, plc_address, category, unit 보강)
        Map<String, OpcuaDataPoint> pointMap = dataPointService.getAllDataPoints().stream()
                .collect(Collectors.toMap(OpcuaDataPoint::getNodeId, dp -> dp, (a, b) -> a));

        List<CollectedDataResponse> responses = data.stream().map(d -> {
            OpcuaDataPoint dp = pointMap.get(d.getNodeId());
            return new CollectedDataResponse(
                    d.getCollectedAt() != null ? d.getCollectedAt().toString() : null,
                    d.getNodeId(),
                    dp != null ? dp.getAasPath() : null,
                    dp != null ? dp.getPlcAddress() : null,
                    dp != null ? dp.getCategory() : null,
                    d.getValue(),
                    dp != null ? dp.getUnit() : null
            );
        }).toList();

        return ResponseEntity.ok(responses);
    }

    // =========================================================================
    // DTOs
    // =========================================================================

    @Schema(description = "수집 채널 응답 DTO")
    public record ChannelResponse(
            @Schema(description = "채널 ID") String channel_id,
            @Schema(description = "채널명") String name,
            @Schema(description = "활성 여부") boolean active,
            @Schema(description = "수집 건수") long collected_count,
            @Schema(description = "최근 수집 시각") String last_collected
    ) {
        public static ChannelResponse from(CollectionChannel ch) {
            return new ChannelResponse(
                    ch.getChannelId(),
                    ch.getChannelName(),
                    "Y".equals(ch.getIsActive()),
                    ch.getCollectedCount() != null ? ch.getCollectedCount() : 0,
                    ch.getLastCollected() != null ? ch.getLastCollected().toString() : null
            );
        }
    }

    @Schema(description = "장비별 수집 상태 응답 DTO")
    public record CollectionStatusResponse(
            @Schema(description = "장비 인스턴스 ID") String instance_id,
            @Schema(description = "장비 인스턴스명") String instance_name,
            @Schema(description = "연결 여부") boolean connected,
            @Schema(description = "최근 수집 시각") String last_collected,
            @Schema(description = "에러 건수") int error_count
    ) {}

    @Schema(description = "수집 데이터 응답 DTO")
    public record CollectedDataResponse(
            @Schema(description = "수집 시각") String timestamp,
            @Schema(description = "OPC-UA 노드 ID") String node_id,
            @Schema(description = "AAS 경로") String aas_path,
            @Schema(description = "PLC 주소") String plc_address,
            @Schema(description = "카테고리(장비)") String category,
            @Schema(description = "수집 값") String value,
            @Schema(description = "단위") String unit
    ) {}
}
