package com.peakmate.backend.interfaces.receipt.controller;

import com.peakmate.backend.application.receipt.ReceiptRecordService;
import com.peakmate.backend.domain.receipt.entity.ReceiptRecord;
import com.peakmate.core.common.ApiResponse;
import com.peakmate.core.security.annotation.RequirePermission;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@Slf4j
@RestController
@RequestMapping("/api/receipt/records")
@RequiredArgsConstructor
public class ReceiptRecordController {

    private final ReceiptRecordService receiptRecordService;

    @RequirePermission(menu = "UT0010", action = "read")
    @GetMapping
    public ApiResponse<List<ReceiptRecord>> search(
            @RequestParam String month,
            @RequestParam(required = false) String type,
            @RequestParam(required = false) String submitter) {
        return ApiResponse.success(receiptRecordService.search(month, type, submitter));
    }

    @RequirePermission(menu = "UT0010", action = "read")
    @GetMapping("/submitters")
    public ApiResponse<List<String>> getSubmitters(@RequestParam String month) {
        return ApiResponse.success(receiptRecordService.getSubmittersByMonth(month));
    }

    @RequirePermission(menu = "UT0010", action = "create")
    @PostMapping("/batch")
    public ApiResponse<List<ReceiptRecord>> batchSave(
            @RequestBody List<Map<String, Object>> payload) {
        try {
            log.info("영수증 일괄 저장 요청: {}건", payload.size());
            List<ReceiptRecord> saved = receiptRecordService.batchSave(payload);
            return ApiResponse.success(saved, saved.size() + "건 저장 완료");
        } catch (Exception e) {
            log.error("영수증 일괄 저장 실패", e);
            return ApiResponse.error("BATCH_SAVE_FAIL", "영수증 저장 실패: " + e.getMessage());
        }
    }
}
