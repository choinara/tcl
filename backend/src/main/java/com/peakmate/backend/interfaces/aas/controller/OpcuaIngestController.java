package com.peakmate.backend.interfaces.aas.controller;

import com.peakmate.backend.application.aas.OpcuaIngestAppService;
import com.peakmate.backend.application.aas.OpcuaIngestAppService.DataPointItem;
import com.peakmate.backend.application.aas.OpcuaIngestAppService.IngestResult;
import com.peakmate.core.common.ApiResponse;
import jakarta.validation.Valid;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotEmpty;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

/**
 * OPC-UA 엣지 서버 -> 백엔드 데이터 수신 API.
 * 인증: X-Api-Key 헤더 (ApiKeyAuthFilter). JWT 불필요.
 */
@Slf4j
@RestController
@RequestMapping("/api/opcua")
@RequiredArgsConstructor
public class OpcuaIngestController {

    private final OpcuaIngestAppService ingestService;

    @PostMapping("/ingest")
    public ResponseEntity<ApiResponse<IngestResponse>> ingest(@Valid @RequestBody IngestRequest request) {
        IngestResult result = ingestService.processBatch(request.edge_id(), request.points());

        log.debug("[ingest] edge={} accepted={} queued={}", request.edge_id(), result.accepted(), result.queued());

        if (result.queueFull()) {
            return ResponseEntity.status(HttpStatus.SERVICE_UNAVAILABLE)
                    .body(ApiResponse.error("QUEUE_FULL", "큐 포화 -- 일부 데이터 미처리"));
        }
        return ResponseEntity.ok(ApiResponse.success(
                new IngestResponse(result.accepted(), result.queued(), "OK")));
    }

    public record IngestRequest(
            @NotBlank String edge_id,
            @NotEmpty List<DataPointItem> points
    ) {}

    public record IngestResponse(
            int accepted,
            int queued,
            String message
    ) {}
}
