package com.peakmate.backend.domain.aps.service;

import com.peakmate.core.aps.*;
import org.springframework.stereotype.Component;

import java.util.List;

/**
 * 기본 제약 플러그인 구현체 (No-Op).
 * 제약 검증을 수행하지 않으며 빈 리스트를 반환한다.
 */
@Component
public class NoOpConstraintPlugin implements ApsConstraintPlugin {

    @Override
    public String getConstraintType() {
        return "NO_OP";
    }

    @Override
    public List<ConstraintViolation> evaluate(
            List<DemandItem> demands,
            List<CapacitySlotDto> capacitySlots,
            List<TaktTimeDto> taktTimes) {
        return List.of();
    }
}
