package com.peakmate.backend.domain.aps.service;

import com.peakmate.backend.infra.repository.aps.ApsCapacitySlotJpaRepository;
import com.peakmate.core.aps.ApsCapacityAdapter;
import com.peakmate.core.aps.CapacitySlotDto;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Component;

import java.time.LocalDate;
import java.util.List;

/**
 * 기본 가용능력 어댑터.
 * aps_capacity_slot 테이블에서 가용능력을 직접 조회한다.
 */
@Component
@RequiredArgsConstructor
public class ApsDefaultCapacityAdapter implements ApsCapacityAdapter {

    private final ApsCapacitySlotJpaRepository capacitySlotRepository;

    @Override
    public List<CapacitySlotDto> loadCapacity(List<String> lineCodes, LocalDate periodStart, LocalDate periodEnd) {
        return capacitySlotRepository
                .findByLineCodeInAndSlotDateBetweenOrderBySlotDateAscLineCodeAsc(lineCodes, periodStart, periodEnd)
                .stream()
                .filter(slot -> "Y".equals(slot.getIsActive()))
                .map(slot -> new CapacitySlotDto(
                        slot.getLineCode(),
                        slot.getSlotDate(),
                        slot.getShift(),
                        slot.getCrew(),
                        slot.getWorkerCount(),
                        slot.getAvailHours(),
                        slot.getAvailWeightKg()
                ))
                .toList();
    }
}
