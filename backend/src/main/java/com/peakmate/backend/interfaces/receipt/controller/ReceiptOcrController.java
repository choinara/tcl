package com.peakmate.backend.interfaces.receipt.controller;

import com.peakmate.backend.application.receipt.OcrExtractor;
import com.peakmate.core.common.ApiResponse;
import com.peakmate.core.security.annotation.RequirePermission;
import com.peakmate.backend.interfaces.receipt.dto.OcrResultDto;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.util.List;

@Slf4j
@RestController
@RequestMapping("/api/receipt/ocr")
@RequiredArgsConstructor
public class ReceiptOcrController {

    private final OcrExtractor ocrExtractor;

    @RequirePermission(menu = "UT0010", action = "create")
    @PostMapping("/extract")
    public ApiResponse<List<OcrResultDto>> extract(
            @RequestParam("file") MultipartFile file,
            @RequestParam(value = "model", required = false) String model) {
        try {
            List<OcrResultDto> results = ocrExtractor.extract(file, model);
            return ApiResponse.success(results);
        } catch (Exception e) {
            log.error("영수증 OCR 추출 실패", e);
            return ApiResponse.error("OCR_FAIL", "영수증 OCR 추출 실패: " + e.getMessage());
        }
    }
}
