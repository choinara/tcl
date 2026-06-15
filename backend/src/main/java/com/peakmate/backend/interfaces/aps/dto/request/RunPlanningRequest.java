package com.peakmate.backend.interfaces.aps.dto.request;

import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.NotNull;

import java.util.List;

/**
 * 계획 실행 요청 DTO.
 */
public record RunPlanningRequest(
        @NotNull(message = "시작일은 필수입니다.")
        String periodStart,

        @NotNull(message = "종료일은 필수입니다.")
        String periodEnd,

        @NotEmpty(message = "대상 호기를 1개 이상 선택해야 합니다.")
        List<String> lineCodes
) {}
