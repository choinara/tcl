package com.peakmate.backend.domain.aps.service;

import com.peakmate.backend.domain.aps.vo.ConstraintResult;
import com.peakmate.core.aps.*;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;
import java.util.Map;

import static org.assertj.core.api.Assertions.assertThat;

/**
 * ApsConstraintEngine 단위 테스트 (9건).
 */
class ApsConstraintEngineTest {

    private ApsConstraintEngine engine;

    @BeforeEach
    void setUp() {
        engine = new ApsConstraintEngine(List.of(new NoOpConstraintPlugin()));
    }

    private DemandItem demand(String productCode, BigDecimal qty, LocalDate dueDate, int priority) {
        return new DemandItem(productCode, "CUST01", dueDate, qty, BigDecimal.ZERO, priority);
    }

    private CapacitySlotDto slot(String lineCode, LocalDate date, BigDecimal hours, int workers) {
        return new CapacitySlotDto(lineCode, date, "DAY", "CREW_A", workers, hours, BigDecimal.ZERO);
    }

    private TaktTimeDto takt(String lineCode, String productCode, BigDecimal minPerKg, int minWorkers) {
        return new TaktTimeDto(lineCode, productCode, minPerKg, minWorkers);
    }

    @Nested
    @DisplayName("정상 케이스")
    class NormalCases {

        @Test
        @DisplayName("1. 수요 3건, 가용능력 충분 -> feasibleDemands 3건")
        void demands3_capacitySufficient_feasible3() {
            List<DemandItem> demands = List.of(
                    demand("P001", BigDecimal.valueOf(100), LocalDate.of(2026, 6, 1), 1),
                    demand("P002", BigDecimal.valueOf(200), LocalDate.of(2026, 6, 2), 1),
                    demand("P003", BigDecimal.valueOf(150), LocalDate.of(2026, 6, 3), 1)
            );
            InventorySnapshot inventory = new InventorySnapshot(Map.of());
            List<CapacitySlotDto> slots = List.of(
                    slot("L01", LocalDate.of(2026, 6, 1), BigDecimal.valueOf(480), 5)
            );
            List<TaktTimeDto> takts = List.of(
                    takt("L01", "P001", BigDecimal.valueOf(1), 1),
                    takt("L01", "P002", BigDecimal.valueOf(1), 1),
                    takt("L01", "P003", BigDecimal.valueOf(1), 1)
            );

            ConstraintResult result = engine.validate(demands, inventory, slots, takts);

            assertThat(result.feasibleDemands()).hasSize(3);
            assertThat(result.unmetDemands()).isEmpty();
        }

        @Test
        @DisplayName("2. 수요 5건 중 2건 NET 수요 0 이하 -> feasibleDemands 3건")
        void demands5_inventory2sufficient_feasible3() {
            List<DemandItem> demands = List.of(
                    demand("P001", BigDecimal.valueOf(100), LocalDate.of(2026, 6, 1), 1),
                    demand("P002", BigDecimal.valueOf(200), LocalDate.of(2026, 6, 2), 1),
                    demand("P003", BigDecimal.valueOf(150), LocalDate.of(2026, 6, 3), 1),
                    demand("P004", BigDecimal.valueOf(50), LocalDate.of(2026, 6, 4), 1),
                    demand("P005", BigDecimal.valueOf(30), LocalDate.of(2026, 6, 5), 1)
            );
            InventorySnapshot inventory = new InventorySnapshot(Map.of(
                    "P004", BigDecimal.valueOf(100),
                    "P005", BigDecimal.valueOf(50)
            ));
            List<CapacitySlotDto> slots = List.of(
                    slot("L01", LocalDate.of(2026, 6, 1), BigDecimal.valueOf(480), 5)
            );
            List<TaktTimeDto> takts = List.of(
                    takt("L01", "P001", BigDecimal.valueOf(1), 1),
                    takt("L01", "P002", BigDecimal.valueOf(1), 1),
                    takt("L01", "P003", BigDecimal.valueOf(1), 1),
                    takt("L01", "P004", BigDecimal.valueOf(1), 1),
                    takt("L01", "P005", BigDecimal.valueOf(1), 1)
            );

            ConstraintResult result = engine.validate(demands, inventory, slots, takts);

            assertThat(result.feasibleDemands()).hasSize(3);
            assertThat(result.unmetDemands()).isEmpty();
        }

        @Test
        @DisplayName("3. 플러그인 0개 (NoOp) -> 플러그인 위반 없이 기본 검증만 수행")
        void noPlugins_basicValidationOnly() {
            ApsConstraintEngine engineNoPlugin = new ApsConstraintEngine(List.of());
            List<DemandItem> demands = List.of(
                    demand("P001", BigDecimal.valueOf(100), LocalDate.of(2026, 6, 1), 1)
            );
            InventorySnapshot inventory = new InventorySnapshot(Map.of());
            List<CapacitySlotDto> slots = List.of(
                    slot("L01", LocalDate.of(2026, 6, 1), BigDecimal.valueOf(10), 5)
            );
            List<TaktTimeDto> takts = List.of(
                    takt("L01", "P001", BigDecimal.valueOf(1), 1)
            );

            ConstraintResult result = engineNoPlugin.validate(demands, inventory, slots, takts);

            assertThat(result.warnings()).isEmpty();
        }
    }

    @Nested
    @DisplayName("경계 케이스")
    class BoundaryCases {

        @Test
        @DisplayName("4. 가용시간 정확히 수요와 일치 -> feasible")
        void capacityExactlyMatches_feasible() {
            List<DemandItem> demands = List.of(
                    demand("P001", BigDecimal.valueOf(100), LocalDate.of(2026, 6, 1), 1)
            );
            InventorySnapshot inventory = new InventorySnapshot(Map.of());
            // 100kg * 1min/kg = 100min -> avail = 100/60 hours
            BigDecimal exactHours = BigDecimal.valueOf(100).divide(BigDecimal.valueOf(60), 4, java.math.RoundingMode.CEILING);
            List<CapacitySlotDto> slots = List.of(
                    slot("L01", LocalDate.of(2026, 6, 1), exactHours, 5)
            );
            List<TaktTimeDto> takts = List.of(
                    takt("L01", "P001", BigDecimal.valueOf(1), 1)
            );

            ConstraintResult result = engine.validate(demands, inventory, slots, takts);

            assertThat(result.feasibleDemands()).hasSize(1);
        }

        @Test
        @DisplayName("5. workerCount == minWorkerCount -> feasible")
        void workerCountExactMatch_feasible() {
            List<DemandItem> demands = List.of(
                    demand("P001", BigDecimal.valueOf(50), LocalDate.of(2026, 6, 1), 1)
            );
            InventorySnapshot inventory = new InventorySnapshot(Map.of());
            List<CapacitySlotDto> slots = List.of(
                    slot("L01", LocalDate.of(2026, 6, 1), BigDecimal.valueOf(10), 3)
            );
            List<TaktTimeDto> takts = List.of(
                    takt("L01", "P001", BigDecimal.valueOf(1), 3)
            );

            ConstraintResult result = engine.validate(demands, inventory, slots, takts);

            assertThat(result.feasibleDemands()).hasSize(1);
        }

        @Test
        @DisplayName("6. 수요 0건 -> feasible 0건, unmet 0건")
        void emptyDemands_emptyResult() {
            ConstraintResult result = engine.validate(
                    List.of(),
                    new InventorySnapshot(Map.of()),
                    List.of(slot("L01", LocalDate.of(2026, 6, 1), BigDecimal.TEN, 5)),
                    List.of(takt("L01", "P001", BigDecimal.ONE, 1))
            );

            assertThat(result.feasibleDemands()).isEmpty();
            assertThat(result.unmetDemands()).isEmpty();
        }
    }

    @Nested
    @DisplayName("예외 케이스")
    class ExceptionCases {

        @Test
        @DisplayName("7. 가용시간 부족 -> unmetDemands에 capacity_exceeded")
        void insufficientCapacity_unmet() {
            List<DemandItem> demands = List.of(
                    demand("P001", BigDecimal.valueOf(1000), LocalDate.of(2026, 6, 1), 1)
            );
            InventorySnapshot inventory = new InventorySnapshot(Map.of());
            // 매우 작은 가용시간
            List<CapacitySlotDto> slots = List.of(
                    slot("L01", LocalDate.of(2026, 6, 1), BigDecimal.ZERO, 5)
            );
            List<TaktTimeDto> takts = List.of(
                    takt("L01", "P001", BigDecimal.valueOf(1), 1)
            );

            ConstraintResult result = engine.validate(demands, inventory, slots, takts);

            assertThat(result.unmetDemands())
                    .anyMatch(u -> "capacity_exceeded".equals(u.reason()));
        }

        @Test
        @DisplayName("8. workerCount < minWorkerCount -> unmetDemands에 min_worker_not_met")
        void insufficientWorkers_unmet() {
            List<DemandItem> demands = List.of(
                    demand("P001", BigDecimal.valueOf(50), LocalDate.of(2026, 6, 1), 1)
            );
            InventorySnapshot inventory = new InventorySnapshot(Map.of());
            List<CapacitySlotDto> slots = List.of(
                    slot("L01", LocalDate.of(2026, 6, 1), BigDecimal.valueOf(10), 1)
            );
            List<TaktTimeDto> takts = List.of(
                    takt("L01", "P001", BigDecimal.valueOf(1), 5)
            );

            ConstraintResult result = engine.validate(demands, inventory, slots, takts);

            assertThat(result.unmetDemands())
                    .anyMatch(u -> "min_worker_not_met".equals(u.reason()));
        }

        @Test
        @DisplayName("9. TaktTime 미등록 -> unmetDemands에 no_takt_time")
        void noTaktTime_unmet() {
            List<DemandItem> demands = List.of(
                    demand("P999", BigDecimal.valueOf(50), LocalDate.of(2026, 6, 1), 1)
            );
            InventorySnapshot inventory = new InventorySnapshot(Map.of());
            List<CapacitySlotDto> slots = List.of(
                    slot("L01", LocalDate.of(2026, 6, 1), BigDecimal.valueOf(10), 5)
            );
            List<TaktTimeDto> takts = List.of(
                    takt("L01", "P001", BigDecimal.valueOf(1), 1)
            );

            ConstraintResult result = engine.validate(demands, inventory, slots, takts);

            assertThat(result.unmetDemands())
                    .anyMatch(u -> "no_takt_time".equals(u.reason()));
        }
    }
}
