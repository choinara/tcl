package com.peakmate.backend.interfaces.aps.dto.response;

import com.peakmate.backend.domain.aps.vo.ConstraintResult;
import com.peakmate.backend.domain.aps.vo.UnmetDemand;

import java.math.BigDecimal;
import java.util.List;
import java.util.Map;

/**
 * 제약 검증 결과 응답 DTO.
 */
public record ConstraintResultResponse(
        int feasibleCount,
        List<UnmetDemandResponse> unmetDemands,
        List<String> warnings,
        Map<String, BigDecimal> capacityUtilization
) {

    public record UnmetDemandResponse(
            String productCode,
            String customerCode,
            String reason,
            String detail
    ) {
        public static UnmetDemandResponse from(UnmetDemand unmet) {
            return new UnmetDemandResponse(
                    unmet.demand().productCode(),
                    unmet.demand().customerCode(),
                    unmet.reason(),
                    unmet.detail()
            );
        }
    }

    public static ConstraintResultResponse from(ConstraintResult result) {
        if (result == null) {
            return new ConstraintResultResponse(0, List.of(), List.of(), Map.of());
        }
        return new ConstraintResultResponse(
                result.feasibleDemands().size(),
                result.unmetDemands().stream().map(UnmetDemandResponse::from).toList(),
                result.warnings(),
                result.capacityUtilization()
        );
    }
}
