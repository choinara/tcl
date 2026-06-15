package com.peakmate.backend.domain.aps.service;

import com.peakmate.backend.domain.aps.entity.ApsScheduleDraft;
import com.peakmate.core.aps.CapacitySlotDto;
import com.peakmate.core.aps.DemandItem;
import com.peakmate.core.aps.TaktTimeDto;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

/**
 * ApsScheduleOptimizer 단위 테스트 (9건).
 */
class ApsScheduleOptimizerTest {

    private ApsScheduleOptimizer optimizer;

    @BeforeEach
    void setUp() {
        optimizer = new ApsScheduleOptimizer();
    }

    private DemandItem demand(String productCode, BigDecimal qty, LocalDate dueDate, int priority) {
        return new DemandItem(productCode, "CUST01", dueDate, qty, BigDecimal.ZERO, priority);
    }

    private CapacitySlotDto slot(String lineCode, LocalDate date, String shift, BigDecimal hours, int workers) {
        return new CapacitySlotDto(lineCode, date, shift, "CREW_A", workers, hours, BigDecimal.ZERO);
    }

    private TaktTimeDto takt(String lineCode, String productCode, BigDecimal minPerKg, int minWorkers) {
        return new TaktTimeDto(lineCode, productCode, minPerKg, minWorkers);
    }

    @Nested
    @DisplayName("정상 케이스")
    class NormalCases {

        @Test
        @DisplayName("1. 수요 2건, 호기 2개, 가용 충분 -> 각 호기에 1건씩 배정")
        void demands2_lines2_eachAssigned() {
            List<DemandItem> demands = List.of(
                    demand("P001", BigDecimal.valueOf(50), LocalDate.of(2026, 6, 1), 1),
                    demand("P002", BigDecimal.valueOf(30), LocalDate.of(2026, 6, 2), 1)
            );
            List<CapacitySlotDto> slots = List.of(
                    slot("L01", LocalDate.of(2026, 6, 1), "DAY", BigDecimal.valueOf(8), 5),
                    slot("L02", LocalDate.of(2026, 6, 1), "DAY", BigDecimal.valueOf(8), 5)
            );
            List<TaktTimeDto> takts = List.of(
                    takt("L01", "P001", BigDecimal.valueOf(1), 1),
                    takt("L02", "P002", BigDecimal.valueOf(1), 1)
            );

            List<ApsScheduleDraft> result = optimizer.optimize(demands, slots, takts);

            assertThat(result).hasSize(2);
            assertThat(result.get(0).getStartTime()).isNotNull();
            assertThat(result.get(0).getEndTime()).isNotNull();
        }

        @Test
        @DisplayName("2. 수요 3건 납기순 정렬 -> dueDate ASC 순서 배정")
        void demands3_sortedByDueDate() {
            List<DemandItem> demands = List.of(
                    demand("P003", BigDecimal.valueOf(10), LocalDate.of(2026, 6, 3), 1),
                    demand("P001", BigDecimal.valueOf(10), LocalDate.of(2026, 6, 1), 1),
                    demand("P002", BigDecimal.valueOf(10), LocalDate.of(2026, 6, 2), 1)
            );
            List<CapacitySlotDto> slots = List.of(
                    slot("L01", LocalDate.of(2026, 6, 1), "DAY", BigDecimal.valueOf(8), 5)
            );
            List<TaktTimeDto> takts = List.of(
                    takt("L01", "P001", BigDecimal.valueOf(1), 1),
                    takt("L01", "P002", BigDecimal.valueOf(1), 1),
                    takt("L01", "P003", BigDecimal.valueOf(1), 1)
            );

            List<ApsScheduleDraft> result = optimizer.optimize(demands, slots, takts);

            assertThat(result).hasSizeGreaterThanOrEqualTo(3);
            // 첫 번째는 납기가 가장 빠른 P001
            assertThat(result.get(0).getProductCode()).isEqualTo("P001");
        }

        @Test
        @DisplayName("3. 동일 납기 + 동일 priority -> demandQty DESC tie-break")
        void sameDueDateAndPriority_largerQtyFirst() {
            LocalDate sameDate = LocalDate.of(2026, 6, 1);
            List<DemandItem> demands = List.of(
                    demand("P_SMALL", BigDecimal.valueOf(10), sameDate, 1),
                    demand("P_LARGE", BigDecimal.valueOf(100), sameDate, 1)
            );
            List<CapacitySlotDto> slots = List.of(
                    slot("L01", sameDate, "DAY", BigDecimal.valueOf(8), 5)
            );
            List<TaktTimeDto> takts = List.of(
                    takt("L01", "P_SMALL", BigDecimal.valueOf(1), 1),
                    takt("L01", "P_LARGE", BigDecimal.valueOf(1), 1)
            );

            List<ApsScheduleDraft> result = optimizer.optimize(demands, slots, takts);

            // 대량 수요 먼저
            assertThat(result.get(0).getProductCode()).isEqualTo("P_LARGE");
        }
    }

    @Nested
    @DisplayName("경계 케이스")
    class BoundaryCases {

        @Test
        @DisplayName("4. 수요 1건, 호기 1개 -> 단일 호기에 전량 배정")
        void demand1_line1_singleAssignment() {
            List<DemandItem> demands = List.of(
                    demand("P001", BigDecimal.valueOf(50), LocalDate.of(2026, 6, 1), 1)
            );
            List<CapacitySlotDto> slots = List.of(
                    slot("L01", LocalDate.of(2026, 6, 1), "DAY", BigDecimal.valueOf(8), 5)
            );
            List<TaktTimeDto> takts = List.of(
                    takt("L01", "P001", BigDecimal.valueOf(1), 1)
            );

            List<ApsScheduleDraft> result = optimizer.optimize(demands, slots, takts);

            assertThat(result).hasSize(1);
            assertThat(result.get(0).getPlannedQty()).isEqualByComparingTo(BigDecimal.valueOf(50));
        }

        @Test
        @DisplayName("5. 수요량이 1개 호기 가용시간 초과 -> 2개 호기에 분할 배정")
        void demandExceedsOneLine_splitToTwo() {
            // L01: 60min avail, L02: 60min avail, demand: 100kg * 1min/kg = 100min
            List<DemandItem> demands = List.of(
                    demand("P001", BigDecimal.valueOf(100), LocalDate.of(2026, 6, 1), 1)
            );
            List<CapacitySlotDto> slots = List.of(
                    slot("L01", LocalDate.of(2026, 6, 1), "DAY", BigDecimal.ONE, 5),
                    slot("L02", LocalDate.of(2026, 6, 1), "DAY", BigDecimal.ONE, 5)
            );
            List<TaktTimeDto> takts = List.of(
                    takt("L01", "P001", BigDecimal.valueOf(1), 1),
                    takt("L02", "P001", BigDecimal.valueOf(1), 1)
            );

            List<ApsScheduleDraft> result = optimizer.optimize(demands, slots, takts);

            assertThat(result).hasSize(2);
            BigDecimal totalQty = result.stream()
                    .map(ApsScheduleDraft::getPlannedQty)
                    .reduce(BigDecimal.ZERO, BigDecimal::add);
            assertThat(totalQty).isEqualByComparingTo(BigDecimal.valueOf(100));
        }

        @Test
        @DisplayName("6. 가용시간 동률 호기 2개 -> lineCode 사전순 첫 번째 호기")
        void equalCapacity_alphabeticalLineFirst() {
            List<DemandItem> demands = List.of(
                    demand("P001", BigDecimal.valueOf(10), LocalDate.of(2026, 6, 1), 1)
            );
            List<CapacitySlotDto> slots = List.of(
                    slot("L02", LocalDate.of(2026, 6, 1), "DAY", BigDecimal.valueOf(8), 5),
                    slot("L01", LocalDate.of(2026, 6, 1), "DAY", BigDecimal.valueOf(8), 5)
            );
            List<TaktTimeDto> takts = List.of(
                    takt("L01", "P001", BigDecimal.valueOf(1), 1),
                    takt("L02", "P001", BigDecimal.valueOf(1), 1)
            );

            List<ApsScheduleDraft> result = optimizer.optimize(demands, slots, takts);

            assertThat(result).hasSize(1);
            assertThat(result.get(0).getLineCode()).isEqualTo("L01");
        }
    }

    @Nested
    @DisplayName("예외 케이스")
    class ExceptionCases {

        @Test
        @DisplayName("7. feasibleDemands 빈 리스트 -> 빈 리스트 반환")
        void emptyDemands_emptyResult() {
            List<ApsScheduleDraft> result = optimizer.optimize(
                    List.of(),
                    List.of(slot("L01", LocalDate.of(2026, 6, 1), "DAY", BigDecimal.TEN, 5)),
                    List.of(takt("L01", "P001", BigDecimal.ONE, 1))
            );

            assertThat(result).isEmpty();
        }

        @Test
        @DisplayName("8. TaktTime 0 -> IllegalArgumentException")
        void taktTimeZero_throwsException() {
            List<DemandItem> demands = List.of(
                    demand("P001", BigDecimal.valueOf(10), LocalDate.of(2026, 6, 1), 1)
            );
            List<CapacitySlotDto> slots = List.of(
                    slot("L01", LocalDate.of(2026, 6, 1), "DAY", BigDecimal.valueOf(8), 5)
            );
            List<TaktTimeDto> takts = List.of(
                    takt("L01", "P001", BigDecimal.ZERO, 1)
            );

            assertThatThrownBy(() -> optimizer.optimize(demands, slots, takts))
                    .isInstanceOf(IllegalArgumentException.class);
        }

        @Test
        @DisplayName("9. 가용시간 0인 호기만 존재 -> 빈 리스트 반환")
        void zeroCapacityOnly_emptyResult() {
            List<DemandItem> demands = List.of(
                    demand("P001", BigDecimal.valueOf(10), LocalDate.of(2026, 6, 1), 1)
            );
            List<CapacitySlotDto> slots = List.of(
                    slot("L01", LocalDate.of(2026, 6, 1), "DAY", BigDecimal.ZERO, 5)
            );
            List<TaktTimeDto> takts = List.of(
                    takt("L01", "P001", BigDecimal.valueOf(1), 1)
            );

            List<ApsScheduleDraft> result = optimizer.optimize(demands, slots, takts);

            assertThat(result).isEmpty();
        }
    }
}
