package com.peakmate.backend.interfaces.aas.controller;

import com.peakmate.backend.application.aas.OpcuaPipelineAppService;
import com.peakmate.backend.domain.aas.entity.OpcuaBatchPending;
import com.peakmate.core.common.ApiResponse;
import com.peakmate.core.security.annotation.RequirePermission;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.Pageable;
import org.springframework.data.web.PageableDefault;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDateTime;
import java.time.ZoneOffset;
import java.util.List;

@RestController
@RequestMapping("/api/opcua/pipeline")
@RequiredArgsConstructor
public class OpcuaPipelineController {

    private final OpcuaPipelineAppService pipelineAppService;

    @GetMapping("/status")
    @RequirePermission(menu = "AA0090", action = "read")
    public ApiResponse<PipelineStatusResponse> getStatus() {
        OpcuaPipelineAppService.PipelineStatusResult result = pipelineAppService.getStatus();
        return ApiResponse.success(new PipelineStatusResponse(
                result.queueSize(), result.queueCapacity(), result.queueFull(),
                Math.round(result.queueUsagePercent() * 10.0) / 10.0,
                result.redisStatus(), result.timescaledbStatus(),
                Math.round(result.insertTps5min() * 100.0) / 100.0,
                result.pendingCount(), result.doneCount(), result.deadCount()
        ));
    }

    @GetMapping("/edges")
    @RequirePermission(menu = "AA0090", action = "read")
    public ApiResponse<List<EdgeStatusResponse>> getEdges() {
        List<EdgeStatusResponse> list = pipelineAppService.getEdgeStatuses().stream()
                .map(s -> new EdgeStatusResponse(
                        s.edgeId(),
                        s.lastIngestAt() != null ? s.lastIngestAt().toString() : null,
                        s.recent1minCount(),
                        s.status()
                ))
                .toList();
        return ApiResponse.success(list);
    }

    @GetMapping("/pending")
    @RequirePermission(menu = "AA0090", action = "read")
    public ApiResponse<Page<PendingItemResponse>> getPending(
            @RequestParam(required = false) List<String> status,
            @PageableDefault(size = 20) Pageable pageable) {
        List<String> statuses = (status != null && !status.isEmpty())
                ? status
                : List.of("PENDING", "DEAD");
        Page<OpcuaBatchPending> page = pipelineAppService.getPendingList(statuses, pageable);
        Page<PendingItemResponse> response = new PageImpl<>(
                page.getContent().stream().map(this::toPendingResponse).toList(),
                pageable, page.getTotalElements()
        );
        return ApiResponse.success(response);
    }

    @PostMapping("/pending/{id}/retry")
    @RequirePermission(menu = "AA0090", action = "update")
    public ApiResponse<RetryResultResponse> retry(@PathVariable Long id) {
        OpcuaPipelineAppService.RetryResult result = pipelineAppService.retryPending(id);
        return ApiResponse.success(new RetryResultResponse(result.id(), result.result(), result.message()));
    }

    @DeleteMapping("/pending/dead")
    @RequirePermission(menu = "AA0090", action = "delete")
    public ApiResponse<DeleteDeadResponse> deleteDead() {
        int deleted = pipelineAppService.deleteDeadPendings();
        return ApiResponse.success(new DeleteDeadResponse(deleted));
    }

    private PendingItemResponse toPendingResponse(OpcuaBatchPending p) {
        return new PendingItemResponse(
                p.getId(), p.getStatus(), p.getRetryCount(), p.getErrorMessage(),
                formatDateTime(p.getCreatedAt()),
                p.getLastRetryAt() != null ? formatDateTime(p.getLastRetryAt()) : null,
                p.getDoneAt() != null ? formatDateTime(p.getDoneAt()) : null
        );
    }

    private String formatDateTime(LocalDateTime dt) {
        return dt != null ? dt.atOffset(ZoneOffset.UTC).toString() : null;
    }

    // Response DTOs (snake_case — AAS 도메인 공식 채택)
    record PipelineStatusResponse(
            int queue_size,
            int queue_capacity,
            boolean queue_full,
            double queue_usage_percent,
            String redis_status,
            String timescaledb_status,
            double insert_tps_5min,
            int pending_count,
            int done_count,
            int dead_count
    ) {}

    record EdgeStatusResponse(
            String edge_id,
            String last_ingest_at,
            int recent_1min_count,
            String status
    ) {}

    record PendingItemResponse(
            long id,
            String status,
            int retry_count,
            String error_message,
            String created_at,
            String last_retry_at,
            String done_at
    ) {}

    record RetryResultResponse(
            long id,
            String result,
            String message
    ) {}

    record DeleteDeadResponse(int deleted_count) {}
}
