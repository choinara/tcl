package com.peakmate.backend.interfaces.aas.controller;

import com.peakmate.backend.domain.aas.entity.OpcuaEdgeLastHeartbeat;
import com.peakmate.backend.domain.aas.entity.OpcuaGatewayLog;
import com.peakmate.backend.domain.aas.service.OpcuaGatewayDomainService;
import com.peakmate.backend.domain.aas.service.OpcuaDataPointDomainService;
import com.peakmate.core.security.annotation.RequirePermission;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.Parameter;
import io.swagger.v3.oas.annotations.media.Schema;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.responses.ApiResponses;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.lang.management.ManagementFactory;
import java.lang.management.MemoryMXBean;
import java.time.Duration;
import java.time.LocalDateTime;
import java.util.*;

/**
 * OPC-UA 게이트웨이 컨트롤러 (AasGatewayPage - AA0070)
 * - 서버 상태 (메모리, 업타임, DEAD 배치 수, 엣지 현황)
 * - 하트비트 수신 (X-Api-Key 인증, 엣지 서버 전용)
 * - 세션 목록 (현재는 Mock — 실제 OPC-UA 서버 통합 시 교체)
 * - 장비별 노드 상태
 * - 게이트웨이 로그 조회/삭제
 */
@Slf4j
@RestController
@RequestMapping("/api/opcua/gateway")
@RequiredArgsConstructor
@Tag(name = "OPC-UA 게이트웨이", description = "게이트웨이 서버 상태, 세션, 장비별 노드, 로그 관리 API")
public class OpcuaGatewayController {

    private final OpcuaGatewayDomainService gatewayService;
    private final OpcuaDataPointDomainService dataPointService;

    private static final LocalDateTime SERVER_START_TIME = LocalDateTime.now();

    // =========================================================================
    // 하트비트 (X-Api-Key 인증 — ApiKeyAuthFilter 처리, @RequirePermission 없음)
    // =========================================================================

    @Operation(summary = "엣지 서버 하트비트 수신", description = "엣지 서버가 주기적으로 상태를 보고합니다. X-Api-Key 헤더 인증 필요.")
    @ApiResponses({
            @ApiResponse(responseCode = "200", description = "하트비트 수신 성공"),
            @ApiResponse(responseCode = "401", description = "API Key 인증 실패")
    })
    @PostMapping("/heartbeat")
    public ResponseEntity<?> receiveHeartbeat(@RequestBody HeartbeatRequest req) {
        gatewayService.receiveHeartbeat(
                req.edge_id(), req.status(), req.ingest_count_1m(),
                req.bridge_status(), req.uptime_sec());
        log.debug("[Heartbeat] edgeId={} status={}", req.edge_id(), req.status());
        return ResponseEntity.ok(Map.of("message", "ok"));
    }

    // =========================================================================
    // 서버 상태
    // =========================================================================

    @Operation(summary = "게이트웨이 서버 상태 조회", description = "OPC-UA 게이트웨이 서버의 상태, 가동시간, 메모리, DEAD 배치 수, 엣지 현황을 조회합니다.")
    @ApiResponses({
            @ApiResponse(responseCode = "200", description = "서버 상태 조회 성공"),
            @ApiResponse(responseCode = "500", description = "서버 내부 오류")
    })
    @RequirePermission(menu = "AA0070", action = "read")
    @GetMapping("/status")
    public ResponseEntity<?> getStatus() {
        MemoryMXBean memBean = ManagementFactory.getMemoryMXBean();
        long usedMb = memBean.getHeapMemoryUsage().getUsed() / (1024 * 1024);

        Duration uptime = Duration.between(SERVER_START_TIME, LocalDateTime.now());
        String uptimeStr = String.format("%dd %dh %dm",
                uptime.toDays(), uptime.toHoursPart(), uptime.toMinutesPart());

        long totalNodes = dataPointService.countActive();
        long deadBatchCount = gatewayService.countDeadBatches();
        List<OpcuaEdgeLastHeartbeat> edges = gatewayService.getEdgeStatuses();

        Map<String, Object> status = new LinkedHashMap<>();
        status.put("endpoint", "opc.tcp://localhost:4840");
        status.put("namespace_uri", "urn:peakmate:opcua:server");
        status.put("security_policy", "Basic256Sha256");
        status.put("status", "RUNNING");
        status.put("uptime", uptimeStr);
        status.put("total_sessions", 0);
        status.put("total_subscriptions", 0);
        status.put("total_monitored_items", totalNodes);
        status.put("cpu_usage", 0.0);
        status.put("memory_mb", usedMb);
        status.put("dead_batch_count", deadBatchCount);
        status.put("edges", edges.stream().map(EdgeStatusResponse::from).toList());

        return ResponseEntity.ok(status);
    }

    // =========================================================================
    // 세션
    // =========================================================================

    @Operation(summary = "활성 세션 목록 조회", description = "현재 OPC-UA 게이트웨이에 연결된 활성 세션 목록을 조회합니다. (현재 Mock 데이터)")
    @ApiResponses({
            @ApiResponse(responseCode = "200", description = "세션 목록 조회 성공"),
            @ApiResponse(responseCode = "500", description = "서버 내부 오류")
    })
    @RequirePermission(menu = "AA0070", action = "read")
    @GetMapping("/sessions")
    public ResponseEntity<List<Map<String, Object>>> getSessions() {
        return ResponseEntity.ok(List.of());
    }

    @Operation(summary = "세션 종료", description = "지정한 세션 ID에 해당하는 OPC-UA 세션을 강제 종료합니다.")
    @ApiResponses({
            @ApiResponse(responseCode = "200", description = "세션 종료 성공"),
            @ApiResponse(responseCode = "403", description = "권한 없음"),
            @ApiResponse(responseCode = "404", description = "세션을 찾을 수 없음"),
            @ApiResponse(responseCode = "500", description = "서버 내부 오류")
    })
    @RequirePermission(menu = "AA0070", action = "delete")
    @DeleteMapping("/sessions/{sessionId}")
    public ResponseEntity<?> terminateSession(@Parameter(description = "종료할 세션 ID") @PathVariable String sessionId) {
        return ResponseEntity.ok(Map.of("message", "세션이 종료되었습니다.", "session_id", sessionId));
    }

    // =========================================================================
    // 장비별 노드 상태
    // =========================================================================

    @Operation(summary = "장비별 노드 상태 조회", description = "장비(카테고리)별 OPC-UA 노드 수, 연결 상태, 최종 읽기/쓰기 시각 등을 조회합니다.")
    @ApiResponses({
            @ApiResponse(responseCode = "200", description = "장비별 노드 상태 조회 성공"),
            @ApiResponse(responseCode = "500", description = "서버 내부 오류")
    })
    @RequirePermission(menu = "AA0070", action = "read")
    @GetMapping("/equip-nodes")
    public ResponseEntity<?> getEquipNodes() {
        var allPoints = dataPointService.getAllDataPoints();
        Map<String, Map<String, Object>> equipMap = new LinkedHashMap<>();

        for (var dp : allPoints) {
            String category = dp.getCategory() != null ? dp.getCategory() : "Unknown";
            equipMap.computeIfAbsent(category, k -> {
                Map<String, Object> m = new LinkedHashMap<>();
                m.put("instance_id", k);
                m.put("instance_name", k);
                m.put("node_count", 0L);
                m.put("connected", true);
                m.put("last_read", LocalDateTime.now().toString());
                m.put("last_write", "");
                m.put("read_count", 0L);
                m.put("write_count", 0L);
                m.put("error_count", 0L);
                return m;
            });
            Map<String, Object> m = equipMap.get(category);
            m.put("node_count", ((Long) m.get("node_count")) + 1);
        }

        return ResponseEntity.ok(new ArrayList<>(equipMap.values()));
    }

    // =========================================================================
    // 게이트웨이 로그
    // =========================================================================

    @Operation(summary = "게이트웨이 로그 조회", description = "OPC-UA 게이트웨이의 최근 로그 목록을 조회합니다.")
    @ApiResponses({
            @ApiResponse(responseCode = "200", description = "로그 조회 성공"),
            @ApiResponse(responseCode = "500", description = "서버 내부 오류")
    })
    @RequirePermission(menu = "AA0070", action = "read")
    @GetMapping("/logs")
    public ResponseEntity<List<GatewayLogResponse>> getLogs() {
        List<OpcuaGatewayLog> logs = gatewayService.getRecentLogs();
        return ResponseEntity.ok(logs.stream().map(GatewayLogResponse::from).toList());
    }

    @Operation(summary = "게이트웨이 로그 전체 삭제", description = "OPC-UA 게이트웨이의 모든 로그를 삭제합니다.")
    @ApiResponses({
            @ApiResponse(responseCode = "200", description = "로그 삭제 성공"),
            @ApiResponse(responseCode = "403", description = "권한 없음"),
            @ApiResponse(responseCode = "500", description = "서버 내부 오류")
    })
    @RequirePermission(menu = "AA0070", action = "delete")
    @DeleteMapping("/logs")
    public ResponseEntity<?> clearLogs() {
        gatewayService.clearLogs();
        return ResponseEntity.ok(Map.of("message", "로그가 삭제되었습니다."));
    }

    // =========================================================================
    // DTOs
    // =========================================================================

    @Schema(description = "엣지 서버 하트비트 요청 DTO")
    public record HeartbeatRequest(
            @Schema(description = "엣지 서버 ID", example = "edge-01")
            String edge_id,
            @Schema(description = "엣지 상태", example = "RUNNING")
            String status,
            @Schema(description = "최근 1분 수집 건수", example = "1200")
            int ingest_count_1m,
            @Schema(description = "브릿지 상태", example = "CONNECTED")
            String bridge_status,
            @Schema(description = "가동 시간(초)", example = "3600")
            long uptime_sec
    ) {}

    @Schema(description = "엣지 서버 상태 응답 DTO")
    public record EdgeStatusResponse(
            @Schema(description = "엣지 서버 ID") String edge_id,
            @Schema(description = "엣지 상태") String status,
            @Schema(description = "최근 1분 수집 건수") int ingest_count_1m,
            @Schema(description = "브릿지 상태") String bridge_status,
            @Schema(description = "가동 시간(초)") long uptime_sec,
            @Schema(description = "마지막 하트비트 시각") String heartbeat_at
    ) {
        public static EdgeStatusResponse from(OpcuaEdgeLastHeartbeat e) {
            return new EdgeStatusResponse(
                    e.getEdgeId(),
                    e.getStatus(),
                    e.getIngestCount1m(),
                    e.getBridgeStatus(),
                    e.getUptimeSec(),
                    e.getHeartbeatAt() != null ? e.getHeartbeatAt().toString() : null);
        }
    }

    @Schema(description = "게이트웨이 로그 응답 DTO")
    public record GatewayLogResponse(
            @Schema(description = "로그 ID", example = "1")
            Long id,
            @Schema(description = "로그 발생 시각", example = "2026-03-19T10:30:00")
            String timestamp,
            @Schema(description = "로그 레벨", example = "INFO")
            String level,
            @Schema(description = "로그 출처", example = "OpcuaServer")
            String source,
            @Schema(description = "로그 메시지", example = "서버가 시작되었습니다.")
            String message
    ) {
        public static GatewayLogResponse from(OpcuaGatewayLog e) {
            return new GatewayLogResponse(
                    e.getId(),
                    e.getCreatedAt() != null ? e.getCreatedAt().toString() : null,
                    e.getLogLevel(),
                    e.getSource(),
                    e.getMessage()
            );
        }
    }
}
