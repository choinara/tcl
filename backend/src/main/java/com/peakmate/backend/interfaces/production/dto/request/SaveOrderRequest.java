package com.peakmate.backend.interfaces.production.dto.request;

import jakarta.validation.Valid;
import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.NotNull;

import java.util.List;
import java.util.Map;

public record SaveOrderRequest(
        @NotNull @Min(2024) @Max(2100)
        Integer year,

        @NotNull @Min(1) @Max(12)
        Integer month,

        @NotEmpty @Valid
        List<OrderRowDto> rows
) {
    public record OrderRowDto(
            Long id,
            @NotNull String polarity,
            @NotNull String site,
            @NotNull String spec,
            @NotNull String material,
            String category,
            String status,
            Map<String, Integer> quantities
    ) {}
}
