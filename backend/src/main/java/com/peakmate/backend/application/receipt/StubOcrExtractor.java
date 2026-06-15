package com.peakmate.backend.application.receipt;

import com.peakmate.backend.interfaces.receipt.dto.OcrResultDto;
import org.springframework.stereotype.Component;
import org.springframework.web.multipart.MultipartFile;

import java.util.List;

/**
 * OCR 스텁 구현체 — 실제 OCR 연동 전까지 사용.
 * 실제 Anthropic API 연동은 AnthropicOcrExtractor로 교체.
 */
@Component
public class StubOcrExtractor implements OcrExtractor {

    @Override
    public List<OcrResultDto> extract(MultipartFile file, String model) {
        OcrResultDto stub = OcrResultDto.builder()
                .transactionDate("2026-01-01 12:00")
                .supplier(OcrResultDto.SupplierInfo.builder()
                        .name("스텁 상호명")
                        .build())
                .items(List.of(OcrResultDto.LineItemDto.builder()
                        .seq(1)
                        .partName("스텁 품목")
                        .quantity(1)
                        .unitPrice(10000)
                        .amount(10000)
                        .build()))
                .summary(OcrResultDto.SummaryDto.builder()
                        .total(10000)
                        .build())
                .handwrittenNotes("(OCR 스텁 — 실제 API 연동 필요)")
                .validation(OcrResultDto.ValidationDto.builder()
                        .isValid(true)
                        .errors(List.of())
                        .warnings(List.of("스텁 데이터입니다. 시스템설정에서 OCR API 키를 등록하세요."))
                        .build())
                .build();
        return List.of(stub);
    }
}
