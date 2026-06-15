package com.peakmate.backend.application.aps.facade;

import com.peakmate.backend.application.aps.dto.command.AdjustPlanCommand;
import com.peakmate.backend.application.aps.dto.command.RunPlanningCommand;
import com.peakmate.backend.application.aps.dto.result.PlanningResult;
import com.peakmate.backend.domain.aps.entity.ApsPlan;
import com.peakmate.backend.domain.aps.entity.ApsScheduleDraft;
import com.peakmate.backend.domain.aps.service.*;
import com.peakmate.backend.domain.aps.vo.ConstraintResult;
import com.peakmate.backend.domain.log.service.SystemLogService;
import com.peakmate.backend.infra.repository.aps.ApsPlanJpaRepository;
import com.peakmate.backend.infra.repository.aps.ApsScheduleDraftJpaRepository;
import com.peakmate.backend.infra.repository.aps.ApsScheduleLotJpaRepository;
import com.peakmate.core.aps.*;
import com.peakmate.core.error.EntityNotFoundException;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.context.SecurityContextHolder;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;
import java.util.Map;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

/**
 * ApsFacade 단위 테스트 (9건).
 */
@ExtendWith(MockitoExtension.class)
class ApsFacadeTest {

    @Mock private ApsConstraintEngine constraintEngine;
    @Mock private ApsScheduleOptimizer scheduleOptimizer;
    @Mock private ApsDemandAdapter demandAdapter;
    @Mock private ApsInventoryAdapter inventoryAdapter;
    @Mock private ApsCapacityAdapter capacityAdapter;
    @Mock private ApsTaktTimeAdapter taktTimeAdapter;
    @Mock private ApsPlanJpaRepository planRepository;
    @Mock private ApsScheduleDraftJpaRepository draftRepository;
    @Mock private ApsScheduleLotJpaRepository lotRepository;
    @Mock private JdbcTemplate jdbcTemplate;
    @Mock private SystemLogService systemLogService;

    @InjectMocks
    private ApsFacade apsFacade;

    @BeforeEach
    void setUp() {
        SecurityContextHolder.getContext().setAuthentication(
                new UsernamePasswordAuthenticationToken("testuser", "password"));
    }

    private ApsPlan createDraftPlan() {
        return ApsPlan.create(
                LocalDate.of(2026, 6, 1),
                LocalDate.of(2026, 6, 30),
                "L01,L02"
        );
    }

    @Nested
    @DisplayName("정상 케이스")
    class NormalCases {

        @Test
        @DisplayName("1. runPlanning 정상 실행 -> ApsPlan DRAFT + ScheduleDraft N건")
        void runPlanning_success() {
            RunPlanningCommand command = new RunPlanningCommand(
                    LocalDate.of(2026, 6, 1),
                    LocalDate.of(2026, 6, 30),
                    List.of("L01", "L02")
            );

            when(demandAdapter.loadDemand(any(), any())).thenReturn(List.of());
            when(inventoryAdapter.loadInventory(any())).thenReturn(new InventorySnapshot(Map.of()));
            when(capacityAdapter.loadCapacity(any(), any(), any())).thenReturn(List.of());
            when(taktTimeAdapter.loadTaktTime(any())).thenReturn(List.of());
            when(constraintEngine.validate(any(), any(), any(), any()))
                    .thenReturn(new ConstraintResult(List.of(), List.of(), List.of(), Map.of()));
            when(scheduleOptimizer.optimize(any(), any(), any())).thenReturn(List.of());

            ApsPlan savedPlan = createDraftPlan();
            when(planRepository.save(any(ApsPlan.class))).thenReturn(savedPlan);
            when(draftRepository.findByPlanIdOrderBySortOrderAsc(any())).thenReturn(List.of());

            PlanningResult result = apsFacade.runPlanning(command);

            assertThat(result).isNotNull();
            assertThat(result.constraintResult()).isNotNull();
            verify(planRepository).save(any(ApsPlan.class));
        }

        @Test
        @DisplayName("2. commitPlan 정상 -> status CONFIRMED")
        void commitPlan_success() {
            ApsPlan plan = createDraftPlan();
            when(planRepository.findById(anyLong())).thenReturn(Optional.of(plan));
            when(planRepository.save(any(ApsPlan.class))).thenReturn(plan);
            when(draftRepository.countByPlanId(any())).thenReturn(5L);

            apsFacade.commitPlan(1L);

            assertThat(plan.getStatus()).isEqualTo("CONFIRMED");
            verify(planRepository).save(plan);
        }

        @Test
        @DisplayName("3. cancelPlan 정상 -> status CANCELLED")
        void cancelPlan_success() {
            ApsPlan plan = createDraftPlan();
            plan.confirm(); // DRAFT -> CONFIRMED 먼저
            when(planRepository.findById(anyLong())).thenReturn(Optional.of(plan));
            when(planRepository.save(any(ApsPlan.class))).thenReturn(plan);

            apsFacade.cancelPlan(1L);

            assertThat(plan.getStatus()).isEqualTo("CANCELLED");
        }
    }

    @Nested
    @DisplayName("경계 케이스")
    class BoundaryCases {

        @Test
        @DisplayName("4. 수요 0건으로 runPlanning -> ApsPlan 생성, ScheduleDraft 0건")
        void runPlanning_zeroDemands_emptySchedules() {
            RunPlanningCommand command = new RunPlanningCommand(
                    LocalDate.of(2026, 6, 1),
                    LocalDate.of(2026, 6, 30),
                    List.of("L01")
            );

            when(demandAdapter.loadDemand(any(), any())).thenReturn(List.of());
            when(inventoryAdapter.loadInventory(any())).thenReturn(new InventorySnapshot(Map.of()));
            when(capacityAdapter.loadCapacity(any(), any(), any())).thenReturn(List.of());
            when(taktTimeAdapter.loadTaktTime(any())).thenReturn(List.of());
            when(constraintEngine.validate(any(), any(), any(), any()))
                    .thenReturn(new ConstraintResult(List.of(), List.of(), List.of(), Map.of()));
            when(scheduleOptimizer.optimize(any(), any(), any())).thenReturn(List.of());

            ApsPlan savedPlan = createDraftPlan();
            when(planRepository.save(any(ApsPlan.class))).thenReturn(savedPlan);
            when(draftRepository.findByPlanIdOrderBySortOrderAsc(any())).thenReturn(List.of());

            PlanningResult result = apsFacade.runPlanning(command);

            assertThat(result.schedules()).isEmpty();
        }

        @Test
        @DisplayName("5. commitPlan @Version 충돌 시나리오 준비 -- plan은 정상 save 가능")
        void commitPlan_versionCheck() {
            ApsPlan plan = createDraftPlan();
            when(planRepository.findById(anyLong())).thenReturn(Optional.of(plan));
            when(planRepository.save(any(ApsPlan.class))).thenReturn(plan);
            when(draftRepository.countByPlanId(any())).thenReturn(3L);

            apsFacade.commitPlan(1L);

            // @Version 충돌은 JPA 레이어에서 ObjectOptimisticLockingFailureException 발생
            // BaseExceptionHandler가 409로 매핑 (통합 테스트에서 검증)
            verify(planRepository).save(plan);
        }

        @Test
        @DisplayName("6. revisePlan -> 원본 REVISED, 신규 DRAFT 생성, draft 복사")
        void revisePlan_success() {
            ApsPlan original = createDraftPlan();
            original.confirm();
            ApsPlan newPlan = createDraftPlan();

            when(planRepository.findById(anyLong())).thenReturn(Optional.of(original));
            when(planRepository.save(any(ApsPlan.class))).thenReturn(newPlan);
            when(draftRepository.findByPlanIdOrderBySortOrderAsc(any())).thenReturn(List.of());
            when(demandAdapter.loadDemand(any(), any())).thenReturn(List.of());
            when(inventoryAdapter.loadInventory(any())).thenReturn(new InventorySnapshot(Map.of()));
            when(capacityAdapter.loadCapacity(any(), any(), any())).thenReturn(List.of());
            when(taktTimeAdapter.loadTaktTime(any())).thenReturn(List.of());
            when(constraintEngine.validate(any(), any(), any(), any()))
                    .thenReturn(new ConstraintResult(List.of(), List.of(), List.of(), Map.of()));

            PlanningResult result = apsFacade.revisePlan(1L);

            assertThat(original.getStatus()).isEqualTo("REVISED");
            assertThat(result).isNotNull();
        }
    }

    @Nested
    @DisplayName("예외 케이스")
    class ExceptionCases {

        @Test
        @DisplayName("7. commitPlan CANCELLED plan -> IllegalStateException")
        void commitPlan_cancelled_throws() {
            ApsPlan plan = createDraftPlan();
            plan.confirm();
            plan.cancel(); // CONFIRMED -> CANCELLED
            when(planRepository.findById(anyLong())).thenReturn(Optional.of(plan));

            assertThatThrownBy(() -> apsFacade.commitPlan(1L))
                    .isInstanceOf(IllegalStateException.class)
                    .hasMessageContaining("DRAFT");
        }

        @Test
        @DisplayName("8. adjustPlan 제약 위반 -> IllegalStateException")
        void adjustPlan_constraintViolation_throws() {
            ApsPlan plan = createDraftPlan();
            ApsScheduleDraft draft = ApsScheduleDraft.create(
                    1L, "L01", LocalDate.of(2026, 6, 1), "DAY", "CREW_A",
                    5, "P001", BigDecimal.valueOf(100), BigDecimal.ONE,
                    null, null, 0);

            when(planRepository.findById(anyLong())).thenReturn(Optional.of(plan));
            when(draftRepository.findByPlanIdOrderBySortOrderAsc(any())).thenReturn(List.of(draft));
            when(capacityAdapter.loadCapacity(any(), any(), any())).thenReturn(List.of());
            when(taktTimeAdapter.loadTaktTime(any())).thenReturn(List.of());
            when(constraintEngine.revalidate(any(), any(), any()))
                    .thenReturn(List.of("호기 L01의 가용시간이 초과되었습니다."));

            // adjustments 빈 리스트 -- 조정 적용 단계 스킵 -> revalidate 단계 도달 -> 위반 감지
            AdjustPlanCommand command = new AdjustPlanCommand(1L, List.of());

            assertThatThrownBy(() -> apsFacade.adjustPlan(command))
                    .isInstanceOf(IllegalStateException.class)
                    .hasMessageContaining("제약 위반");
        }

        @Test
        @DisplayName("9. 존재하지 않는 planId -> EntityNotFoundException")
        void commitPlan_notFound_throws() {
            when(planRepository.findById(anyLong())).thenReturn(Optional.empty());

            assertThatThrownBy(() -> apsFacade.commitPlan(999L))
                    .isInstanceOf(EntityNotFoundException.class);
        }
    }
}
