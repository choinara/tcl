package com.peakmate.backend.interfaces.production.dto.request;

import jakarta.validation.Valid;
import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.NotNull;

import java.math.BigDecimal;
import java.util.List;
import java.util.Map;

public record SaveDailyPlanRequest(
        @NotNull @Min(2024) @Max(2100)
        Integer year,

        @NotNull @Min(1) @Max(12)
        Integer month,

        @NotEmpty @Valid
        List<PlanRowDto> rows
) {
    public record PlanRowDto(
            Long id,
            String customer,
            @NotNull String lineCode,
            @NotNull String productName,
            @NotNull String spec,
            @NotNull String material,
            @NotNull String planType,
            Integer monthOffset,
            Map<String, BigDecimal> quantities
    ) {}
}
