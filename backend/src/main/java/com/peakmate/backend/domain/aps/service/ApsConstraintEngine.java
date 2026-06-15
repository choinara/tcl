package com.peakmate.backend.domain.aps.service;

import com.peakmate.backend.domain.aps.vo.ConstraintResult;
import com.peakmate.backend.domain.aps.vo.UnmetDemand;
import com.peakmate.core.aps.*;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.util.*;

/**
 * APS 제약 검증 엔진.
 * NET 수요 산출 -> 호기 가용시간 체크 -> 작업자 요건 체크 -> 플러그인 순회.
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class ApsConstraintEngine {

    private final List<ApsConstraintPlugin> plugins;

    /**
     * 수요/재고/가용능력/Takt time을 기반으로 제약 검증을 수행한다.
     *
     * @param demands       수요 목록
     * @param inventory     재고 스냅샷
     * @param capacitySlots 가용능력 슬롯 목록
     * @param taktTimes     Takt time 마스터 목록
     * @return 제약 검증 결과
     */
    public ConstraintResult validate(
            List<DemandItem> demands,
            InventorySnapshot inventory,
            List<CapacitySlotDto> capacitySlots,
            List<TaktTimeDto> taktTimes) {

        List<DemandItem> feasibleDemands = new ArrayList<>();
        List<UnmetDemand> unmetDemands = new ArrayList<>();
        List<String> warnings = new ArrayList<>();
        Map<String, BigDecimal> capacityUtilization = new LinkedHashMap<>();

        // TaktTime 맵: lineCode -> productCode -> TaktTimeDto
        Map<String, Map<String, TaktTimeDto>> taktTimeMap = buildTaktTimeMap(taktTimes);

        // 호기별 총 가용시간 (분 단위)
        Map<String, BigDecimal> totalAvailMinutesByLine = new LinkedHashMap<>();
        Map<String, BigDecimal> usedMinutesByLine = new LinkedHashMap<>();
        Map<String, Integer> minWorkerByLine = new LinkedHashMap<>();

        for (CapacitySlotDto slot : capacitySlots) {
            BigDecimal availMinutes = slot.availHours().multiply(BigDecimal.valueOf(60));
            totalAvailMinutesByLine.merge(slot.lineCode(), availMinutes, BigDecimal::add);
            usedMinutesByLine.putIfAbsent(slot.lineCode(), BigDecimal.ZERO);
        }

        // 각 수요에 대해 제약 검증
        for (DemandItem demand : demands) {
            // 1. NET 수요 산출
            BigDecimal available = inventory.getAvailable(demand.productCode());
            BigDecimal netDemand = demand.demandQty().subtract(available);

            if (netDemand.compareTo(BigDecimal.ZERO) <= 0) {
                // 재고로 충족 가능 -- feasible이지만 생산 불필요
                continue;
            }

            // 2. TaktTime 존재 여부 확인 -- 최소 1개 호기에서 생산 가능해야 함
            boolean hasTaktTime = false;
            for (Map.Entry<String, Map<String, TaktTimeDto>> entry : taktTimeMap.entrySet()) {
                if (entry.getValue().containsKey(demand.productCode())) {
                    hasTaktTime = true;

                    String lineCode = entry.getKey();
                    TaktTimeDto takt = entry.getValue().get(demand.productCode());

                    // 3. 작업자 인원 체크
                    int maxWorkerInSlots = capacitySlots.stream()
                            .filter(s -> s.lineCode().equals(lineCode))
                            .mapToInt(CapacitySlotDto::workerCount)
                            .max()
                            .orElse(0);

                    if (maxWorkerInSlots < takt.minWorkerCount()) {
                        minWorkerByLine.put(lineCode, takt.minWorkerCount());
                    }

                    // 4. 호기 가용시간 체크
                    BigDecimal requiredMinutes = netDemand.multiply(takt.taktTimeMinPerKg());
                    BigDecimal totalAvail = totalAvailMinutesByLine.getOrDefault(lineCode, BigDecimal.ZERO);
                    BigDecimal alreadyUsed = usedMinutesByLine.getOrDefault(lineCode, BigDecimal.ZERO);
                    BigDecimal remaining = totalAvail.subtract(alreadyUsed);

                    if (remaining.compareTo(requiredMinutes) >= 0) {
                        usedMinutesByLine.merge(lineCode, requiredMinutes, BigDecimal::add);
                    }
                }
            }

            if (!hasTaktTime) {
                unmetDemands.add(new UnmetDemand(demand, "no_takt_time",
                        "제품 " + demand.productCode() + "에 대한 Takt time이 등록되지 않았습니다."));
                continue;
            }

            // 가용능력 총합 vs 요구 시간 체크
            BigDecimal netDemandMinutes = BigDecimal.ZERO;
            boolean canProduce = false;
            for (Map.Entry<String, Map<String, TaktTimeDto>> entry : taktTimeMap.entrySet()) {
                TaktTimeDto takt = entry.getValue().get(demand.productCode());
                if (takt != null) {
                    String lineCode = entry.getKey();
                    BigDecimal totalAvail = totalAvailMinutesByLine.getOrDefault(lineCode, BigDecimal.ZERO);
                    if (totalAvail.compareTo(BigDecimal.ZERO) > 0) {
                        canProduce = true;
                    }
                    netDemandMinutes = netDemand.multiply(takt.taktTimeMinPerKg());
                }
            }

            if (!canProduce) {
                unmetDemands.add(new UnmetDemand(demand, "capacity_exceeded",
                        "제품 " + demand.productCode() + "의 수요를 처리할 가용능력이 없습니다."));
                continue;
            }

            // 작업자 인원 부족 호기 경고
            for (Map.Entry<String, Integer> entry : minWorkerByLine.entrySet()) {
                int maxWorkerInSlots = capacitySlots.stream()
                        .filter(s -> s.lineCode().equals(entry.getKey()))
                        .mapToInt(CapacitySlotDto::workerCount)
                        .max()
                        .orElse(0);
                if (maxWorkerInSlots < entry.getValue()) {
                    unmetDemands.add(new UnmetDemand(demand, "min_worker_not_met",
                            "호기 " + entry.getKey() + "의 최소 작업자 인원(" + entry.getValue() + "명)이 부족합니다."));
                }
            }

            // 최소 작업자 부족이 아닌 경우 feasible 판정
            boolean workerIssue = unmetDemands.stream()
                    .anyMatch(u -> u.demand().equals(demand) && "min_worker_not_met".equals(u.reason()));
            if (!workerIssue) {
                feasibleDemands.add(new DemandItem(
                        demand.productCode(), demand.customerCode(), demand.dueDate(),
                        netDemand, demand.rtfQty(), demand.priority()));
            }

            minWorkerByLine.clear();
        }

        // 5. 플러그인 실행
        for (ApsConstraintPlugin plugin : plugins) {
            List<ConstraintViolation> violations = plugin.evaluate(feasibleDemands, capacitySlots, taktTimes);
            for (ConstraintViolation v : violations) {
                warnings.add("[" + v.constraintType() + "] " + v.detailMessage());
            }
        }

        // 6. 부하율 산출
        for (Map.Entry<String, BigDecimal> entry : totalAvailMinutesByLine.entrySet()) {
            String lineCode = entry.getKey();
            BigDecimal totalAvail = entry.getValue();
            BigDecimal used = usedMinutesByLine.getOrDefault(lineCode, BigDecimal.ZERO);
            if (totalAvail.compareTo(BigDecimal.ZERO) > 0) {
                BigDecimal utilization = used.multiply(BigDecimal.valueOf(100))
                        .divide(totalAvail, 1, RoundingMode.HALF_UP);
                capacityUtilization.put(lineCode, utilization);
            } else {
                capacityUtilization.put(lineCode, BigDecimal.ZERO);
            }
        }

        return new ConstraintResult(feasibleDemands, unmetDemands, warnings, capacityUtilization);
    }

    /**
     * 조정된 draft에 대해 재검증을 수행한다.
     */
    public List<String> revalidate(
            List<com.peakmate.backend.domain.aps.entity.ApsScheduleDraft> adjustedDrafts,
            List<CapacitySlotDto> capacitySlots,
            List<TaktTimeDto> taktTimes) {

        List<String> violations = new ArrayList<>();
        Map<String, Map<String, TaktTimeDto>> taktTimeMap = buildTaktTimeMap(taktTimes);

        // 호기별 가용시간(분) 합산
        Map<String, BigDecimal> totalAvailMinutes = new LinkedHashMap<>();
        for (CapacitySlotDto slot : capacitySlots) {
            totalAvailMinutes.merge(slot.lineCode(),
                    slot.availHours().multiply(BigDecimal.valueOf(60)), BigDecimal::add);
        }

        // 호기별 배정 시간 합산
        Map<String, BigDecimal> usedMinutes = new LinkedHashMap<>();
        for (var draft : adjustedDrafts) {
            Map<String, TaktTimeDto> lineMap = taktTimeMap.getOrDefault(draft.getLineCode(), Map.of());
            TaktTimeDto takt = lineMap.get(draft.getProductCode());
            if (takt == null) {
                violations.add("호기 " + draft.getLineCode() + "에 제품 " + draft.getProductCode() + "의 Takt time이 없습니다.");
                continue;
            }
            BigDecimal required = draft.getPlannedQty().multiply(takt.taktTimeMinPerKg());
            usedMinutes.merge(draft.getLineCode(), required, BigDecimal::add);
        }

        // 초과 검증
        for (Map.Entry<String, BigDecimal> entry : usedMinutes.entrySet()) {
            BigDecimal avail = totalAvailMinutes.getOrDefault(entry.getKey(), BigDecimal.ZERO);
            if (entry.getValue().compareTo(avail) > 0) {
                violations.add("호기 " + entry.getKey() + "의 가용시간이 초과되었습니다. (필요: "
                        + entry.getValue().setScale(1, RoundingMode.HALF_UP) + "분, 가용: "
                        + avail.setScale(1, RoundingMode.HALF_UP) + "분)");
            }
        }

        return violations;
    }

    private Map<String, Map<String, TaktTimeDto>> buildTaktTimeMap(List<TaktTimeDto> taktTimes) {
        Map<String, Map<String, TaktTimeDto>> map = new LinkedHashMap<>();
        for (TaktTimeDto takt : taktTimes) {
            map.computeIfAbsent(takt.lineCode(), k -> new LinkedHashMap<>())
                    .put(takt.productCode(), takt);
        }
        return map;
    }
}
