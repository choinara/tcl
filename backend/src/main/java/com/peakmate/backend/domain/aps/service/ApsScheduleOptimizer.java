package com.peakmate.backend.domain.aps.service;

import com.peakmate.backend.domain.aps.entity.ApsScheduleDraft;
import com.peakmate.core.aps.CapacitySlotDto;
import com.peakmate.core.aps.DemandItem;
import com.peakmate.core.aps.TaktTimeDto;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDateTime;
import java.time.LocalTime;
import java.util.*;

/**
 * APS 스케줄 최적화 엔진 (EDD Heuristic).
 * 1. EDD 정렬: dueDate ASC, priority ASC, demandQty DESC
 * 2. 호기별 가용시간 최다 호기 우선 배정
 * 3. 소요시간 = demandQty * taktTimeMinPerKg
 */
@Slf4j
@Service
public class ApsScheduleOptimizer {

    private static final LocalTime DAY_SHIFT_START = LocalTime.of(8, 0);
    private static final LocalTime NIGHT_SHIFT_START = LocalTime.of(20, 0);

    /**
     * feasibleDemands를 최적화하여 ApsScheduleDraft 리스트를 생성한다.
     * planId는 아직 미확정이므로 0L을 설정 -- 호출자가 save 후 교체한다.
     *
     * @param feasibleDemands 실행 가능 수요 목록
     * @param capacitySlots   가용능력 슬롯 목록
     * @param taktTimes       Takt time 마스터 목록
     * @return 배정 결과 draft 리스트
     */
    public List<ApsScheduleDraft> optimize(
            List<DemandItem> feasibleDemands,
            List<CapacitySlotDto> capacitySlots,
            List<TaktTimeDto> taktTimes) {

        if (feasibleDemands.isEmpty()) {
            return List.of();
        }

        // TaktTime 맵: lineCode -> productCode -> TaktTimeDto
        Map<String, Map<String, TaktTimeDto>> taktTimeMap = new LinkedHashMap<>();
        for (TaktTimeDto takt : taktTimes) {
            taktTimeMap.computeIfAbsent(takt.lineCode(), k -> new LinkedHashMap<>())
                    .put(takt.productCode(), takt);
        }

        // 호기-Shift 별 잔여 가용시간(분) 추적
        Map<String, BigDecimal> remainingMinutes = new LinkedHashMap<>();
        Map<String, CapacitySlotDto> slotMap = new LinkedHashMap<>();
        // 호기-Shift별 현재 종료시각 추적 (startTime/endTime 산출용)
        Map<String, LocalDateTime> slotEndTimeTracker = new LinkedHashMap<>();

        for (CapacitySlotDto slot : capacitySlots) {
            String slotKey = slot.lineCode() + "|" + slot.slotDate() + "|" + slot.shift();
            BigDecimal availMinutes = slot.availHours().multiply(BigDecimal.valueOf(60));
            remainingMinutes.put(slotKey, availMinutes);
            slotMap.put(slotKey, slot);

            LocalTime shiftStart = "NIGHT".equals(slot.shift()) ? NIGHT_SHIFT_START : DAY_SHIFT_START;
            slotEndTimeTracker.put(slotKey, LocalDateTime.of(slot.slotDate(), shiftStart));
        }

        // EDD 정렬: dueDate ASC, priority ASC, demandQty DESC
        List<DemandItem> sorted = new ArrayList<>(feasibleDemands);
        sorted.sort(Comparator
                .comparing(DemandItem::dueDate)
                .thenComparingInt(DemandItem::priority)
                .thenComparing(DemandItem::demandQty, Comparator.reverseOrder()));

        List<ApsScheduleDraft> drafts = new ArrayList<>();
        int sortOrder = 0;

        for (DemandItem demand : sorted) {
            BigDecimal remainingQty = demand.demandQty();

            // 생산 가능 호기 목록 (TaktTimeMaster 존재 + 잔여 시간 > 0)
            List<String> eligibleSlotKeys = new ArrayList<>();
            for (Map.Entry<String, BigDecimal> entry : remainingMinutes.entrySet()) {
                if (entry.getValue().compareTo(BigDecimal.ZERO) <= 0) continue;

                String slotKey = entry.getKey();
                String lineCode = slotKey.split("\\|")[0];
                Map<String, TaktTimeDto> lineMap = taktTimeMap.getOrDefault(lineCode, Map.of());
                if (lineMap.containsKey(demand.productCode())) {
                    eligibleSlotKeys.add(slotKey);
                }
            }

            // 가용시간 많은 순 정렬 (동률: lineCode 사전순)
            eligibleSlotKeys.sort((a, b) -> {
                int cmp = remainingMinutes.getOrDefault(b, BigDecimal.ZERO)
                        .compareTo(remainingMinutes.getOrDefault(a, BigDecimal.ZERO));
                if (cmp != 0) return cmp;
                return a.compareTo(b);
            });

            for (String slotKey : eligibleSlotKeys) {
                if (remainingQty.compareTo(BigDecimal.ZERO) <= 0) break;

                CapacitySlotDto slot = slotMap.get(slotKey);
                String lineCode = slot.lineCode();
                TaktTimeDto takt = taktTimeMap.get(lineCode).get(demand.productCode());

                if (takt.taktTimeMinPerKg().compareTo(BigDecimal.ZERO) <= 0) {
                    throw new IllegalArgumentException("Takt time은 0보다 커야 합니다. 호기: " + lineCode
                            + ", 제품: " + demand.productCode());
                }

                BigDecimal availMin = remainingMinutes.get(slotKey);
                // 이 슬롯에서 생산 가능한 최대 수량
                BigDecimal maxQty = availMin.divide(takt.taktTimeMinPerKg(), 3, RoundingMode.FLOOR);

                BigDecimal allocQty = remainingQty.min(maxQty);
                if (allocQty.compareTo(BigDecimal.ZERO) <= 0) continue;

                BigDecimal requiredMinutes = allocQty.multiply(takt.taktTimeMinPerKg());

                // 시간 산출
                LocalDateTime startTime = slotEndTimeTracker.get(slotKey);
                LocalDateTime endTime = startTime.plusMinutes(requiredMinutes.longValue())
                        .plusSeconds(requiredMinutes.remainder(BigDecimal.ONE)
                                .multiply(BigDecimal.valueOf(60)).longValue());

                ApsScheduleDraft draft = ApsScheduleDraft.create(
                        0L, // planId 미확정
                        lineCode,
                        slot.slotDate(),
                        slot.shift(),
                        slot.crew(),
                        slot.workerCount(),
                        demand.productCode(),
                        allocQty,
                        takt.taktTimeMinPerKg(),
                        startTime,
                        endTime,
                        sortOrder++
                );

                drafts.add(draft);

                // 잔여 가용시간 차감
                remainingMinutes.put(slotKey, availMin.subtract(requiredMinutes));
                slotEndTimeTracker.put(slotKey, endTime);
                remainingQty = remainingQty.subtract(allocQty);
            }

            if (remainingQty.compareTo(BigDecimal.ZERO) > 0) {
                log.warn("수요 미배정 잔량: 제품={}, 잔량={}", demand.productCode(), remainingQty);
            }
        }

        return drafts;
    }
}
