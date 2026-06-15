package com.peakmate.backend.application.aps.facade;

import com.peakmate.backend.application.aps.dto.command.AdjustPlanCommand;
import com.peakmate.backend.application.aps.dto.command.RunPlanningCommand;
import com.peakmate.backend.application.aps.dto.result.PlanningResult;
import com.peakmate.backend.domain.aps.entity.ApsPlan;
import com.peakmate.backend.domain.aps.entity.ApsScheduleDraft;
import com.peakmate.backend.domain.aps.service.ApsConstraintEngine;
import com.peakmate.backend.domain.aps.service.ApsScheduleOptimizer;
import com.peakmate.backend.domain.aps.vo.ConstraintResult;
import com.peakmate.backend.domain.log.service.SystemLogService;
import com.peakmate.backend.infra.repository.aps.ApsPlanJpaRepository;
import com.peakmate.backend.infra.repository.aps.ApsScheduleDraftJpaRepository;
import com.peakmate.backend.infra.repository.aps.ApsScheduleLotJpaRepository;
import com.peakmate.core.aps.*;
import com.peakmate.core.error.EntityNotFoundException;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.sql.PreparedStatement;
import java.sql.Timestamp;
import java.time.LocalDateTime;
import java.util.List;
import java.util.stream.Collectors;

/**
 * APS 오케스트레이션 Facade.
 * runPlanning / adjustPlan / commitPlan / cancelPlan / revisePlan.
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class ApsFacade {

    private final ApsConstraintEngine constraintEngine;
    private final ApsScheduleOptimizer scheduleOptimizer;
    private final ApsDemandAdapter demandAdapter;
    private final ApsInventoryAdapter inventoryAdapter;
    private final ApsCapacityAdapter capacityAdapter;
    private final ApsTaktTimeAdapter taktTimeAdapter;
    private final ApsPlanJpaRepository planRepository;
    private final ApsScheduleDraftJpaRepository draftRepository;
    private final ApsScheduleLotJpaRepository lotRepository;
    private final JdbcTemplate jdbcTemplate;
    private final SystemLogService systemLogService;

    private static final int BATCH_SIZE = 500;

    /**
     * 계획 실행.
     */
    @Transactional
    public PlanningResult runPlanning(RunPlanningCommand command) {
        String currentUser = getCurrentUser();

        // 1. 데이터 수집
        List<DemandItem> demands = demandAdapter.loadDemand(command.periodStart(), command.periodEnd());
        InventorySnapshot inventory = inventoryAdapter.loadInventory(command.lineCodes());
        List<CapacitySlotDto> capacitySlots = capacityAdapter.loadCapacity(
                command.lineCodes(), command.periodStart(), command.periodEnd());
        List<TaktTimeDto> taktTimes = taktTimeAdapter.loadTaktTime(command.lineCodes());

        // 2. 제약 검증
        ConstraintResult constraintResult = constraintEngine.validate(demands, inventory, capacitySlots, taktTimes);

        // 3. 스케줄 최적화
        List<ApsScheduleDraft> drafts = scheduleOptimizer.optimize(
                constraintResult.feasibleDemands(), capacitySlots, taktTimes);

        // 4. ApsPlan 생성
        String lineCodesStr = String.join(",", command.lineCodes());
        ApsPlan plan = ApsPlan.create(command.periodStart(), command.periodEnd(), lineCodesStr);
        plan = planRepository.save(plan);
        Long planId = plan.getId();

        // 5. ScheduleDraft batch insert
        if (!drafts.isEmpty()) {
            batchInsertDrafts(planId, drafts);
        }

        // 6. SystemLog
        try {
            systemLogService.log("DATA_CHANGE", null, currentUser, null, "APS 계획 실행",
                    "기간: " + command.periodStart() + "~" + command.periodEnd()
                            + ", 호기: " + lineCodesStr + ", 배정: " + drafts.size() + "건");
        } catch (Exception e) {
            log.warn("[시스템 로그 기록 실패] APS 계획 실행", e);
        }

        // planId가 반영된 drafts를 다시 조회
        List<ApsScheduleDraft> savedDrafts = draftRepository.findByPlanIdOrderBySortOrderAsc(planId);

        return new PlanningResult(planId, savedDrafts, constraintResult);
    }

    /**
     * 수동 조정.
     */
    @Transactional
    public void adjustPlan(AdjustPlanCommand command) {
        String currentUser = getCurrentUser();

        ApsPlan plan = planRepository.findById(command.planId())
                .orElseThrow(() -> new EntityNotFoundException("계획을 찾을 수 없습니다. planId=" + command.planId()));

        if (!"DRAFT".equals(plan.getStatus())) {
            throw new IllegalStateException("DRAFT 상태의 계획만 조정할 수 있습니다. 현재 상태: " + plan.getStatus());
        }

        // 조정 대상 draft 조회
        List<ApsScheduleDraft> existingDrafts = draftRepository.findByPlanIdOrderBySortOrderAsc(command.planId());

        // 조정 적용
        for (AdjustPlanCommand.AdjustmentItem adj : command.adjustments()) {
            ApsScheduleDraft draft = existingDrafts.stream()
                    .filter(d -> d.getId().equals(adj.draftId()))
                    .findFirst()
                    .orElseThrow(() -> new EntityNotFoundException("배정 결과를 찾을 수 없습니다. draftId=" + adj.draftId()));

            draft.updateAdjustment(adj.plannedQty(), adj.lineCode(), adj.shift(),
                    adj.crew(), adj.workerCount(), adj.remark());
        }

        // 재검증
        List<String> lineCodes = List.of(plan.getLineCodes().split(","));
        List<CapacitySlotDto> capacitySlots = capacityAdapter.loadCapacity(
                lineCodes, plan.getPeriodStart(), plan.getPeriodEnd());
        List<TaktTimeDto> taktTimes = taktTimeAdapter.loadTaktTime(lineCodes);

        List<String> violations = constraintEngine.revalidate(existingDrafts, capacitySlots, taktTimes);
        if (!violations.isEmpty()) {
            throw new IllegalStateException("제약 위반: " + String.join("; ", violations));
        }

        draftRepository.saveAll(existingDrafts);

        try {
            systemLogService.log("DATA_CHANGE", null, currentUser, null, "APS 수동 조정",
                    "planId=" + command.planId() + ", 조정: " + command.adjustments().size() + "건");
        } catch (Exception e) {
            log.warn("[시스템 로그 기록 실패] APS 수동 조정", e);
        }
    }

    /**
     * 계획 확정.
     */
    @Transactional
    public void commitPlan(Long planId) {
        String currentUser = getCurrentUser();

        ApsPlan plan = planRepository.findById(planId)
                .orElseThrow(() -> new EntityNotFoundException("계획을 찾을 수 없습니다. planId=" + planId));

        plan.confirm();
        planRepository.save(plan);

        // PM0030 일생산계획 upsert (stub)
        // planType="APS계획", productName=productCode 그대로, customer/spec/material=""
        // 일자별 SUM 집계 (lineCode+productCode+planDate 그룹핑)
        // v2에서 MasterProduct 조인으로 보완 예정
        log.info("PM0030 upsert stub: planId={}", planId);

        try {
            long scheduleCount = draftRepository.countByPlanId(planId);
            systemLogService.log("APPROVAL", null, currentUser, null, "APS 계획 확정",
                    "planId=" + planId + ", 배정: " + scheduleCount + "건");
        } catch (Exception e) {
            log.warn("[시스템 로그 기록 실패] APS 계획 확정", e);
        }
    }

    /**
     * 계획 취소.
     */
    @Transactional
    public void cancelPlan(Long planId) {
        String currentUser = getCurrentUser();

        ApsPlan plan = planRepository.findById(planId)
                .orElseThrow(() -> new EntityNotFoundException("계획을 찾을 수 없습니다. planId=" + planId));

        plan.cancel();
        planRepository.save(plan);

        try {
            systemLogService.log("APPROVAL_CANCEL", null, currentUser, null, "APS 계획 취소",
                    "planId=" + planId);
        } catch (Exception e) {
            log.warn("[시스템 로그 기록 실패] APS 계획 취소", e);
        }
    }

    /**
     * 계획 수정 (CONFIRMED -> REVISED + 신규 DRAFT 복사).
     */
    @Transactional
    public PlanningResult revisePlan(Long planId) {
        String currentUser = getCurrentUser();

        ApsPlan original = planRepository.findById(planId)
                .orElseThrow(() -> new EntityNotFoundException("계획을 찾을 수 없습니다. planId=" + planId));

        original.revise();
        planRepository.save(original);

        // 신규 DRAFT 생성 (동일 기간/호기)
        ApsPlan newPlan = ApsPlan.create(original.getPeriodStart(), original.getPeriodEnd(), original.getLineCodes());
        newPlan = planRepository.save(newPlan);
        Long newPlanId = newPlan.getId();

        // 기존 draft 복사
        List<ApsScheduleDraft> originalDrafts = draftRepository.findByPlanIdOrderBySortOrderAsc(planId);
        if (!originalDrafts.isEmpty()) {
            List<ApsScheduleDraft> copiedDrafts = originalDrafts.stream()
                    .map(d -> ApsScheduleDraft.create(
                            newPlanId, d.getLineCode(), d.getPlanDate(), d.getShift(),
                            d.getCrew(), d.getWorkerCount(), d.getProductCode(),
                            d.getPlannedQty(), d.getTaktTime(), d.getStartTime(),
                            d.getEndTime(), d.getSortOrder()))
                    .toList();
            batchInsertDrafts(newPlanId, copiedDrafts);
        }

        List<ApsScheduleDraft> savedDrafts = draftRepository.findByPlanIdOrderBySortOrderAsc(newPlanId);

        // 제약 결과 재생성 (빈 결과로 반환 -- 수정 시에는 기존 draft 복사만)
        List<String> lineCodes = List.of(original.getLineCodes().split(","));
        List<CapacitySlotDto> capacitySlots = capacityAdapter.loadCapacity(
                lineCodes, original.getPeriodStart(), original.getPeriodEnd());
        List<TaktTimeDto> taktTimes = taktTimeAdapter.loadTaktTime(lineCodes);
        InventorySnapshot inventory = inventoryAdapter.loadInventory(lineCodes);
        List<DemandItem> demands = demandAdapter.loadDemand(original.getPeriodStart(), original.getPeriodEnd());

        ConstraintResult constraintResult = constraintEngine.validate(demands, inventory, capacitySlots, taktTimes);

        try {
            systemLogService.log("DATA_CHANGE", null, currentUser, null, "APS 계획 수정",
                    "원본 planId=" + planId + ", 신규 planId=" + newPlanId);
        } catch (Exception e) {
            log.warn("[시스템 로그 기록 실패] APS 계획 수정", e);
        }

        return new PlanningResult(newPlanId, savedDrafts, constraintResult);
    }

    /**
     * JdbcTemplate batch insert for ApsScheduleDraft.
     */
    private void batchInsertDrafts(Long planId, List<ApsScheduleDraft> drafts) {
        String sql = """
                INSERT INTO aps_schedule_draft (plan_id, line_code, plan_date, shift, crew,
                    worker_count, product_code, planned_qty, takt_time, start_time, end_time,
                    sort_order, remark, created_at, updated_at, created_by, updated_by)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
                """;

        String currentUser = getCurrentUser();
        LocalDateTime now = LocalDateTime.now();

        jdbcTemplate.batchUpdate(sql, drafts, BATCH_SIZE, (PreparedStatement ps, ApsScheduleDraft d) -> {
            ps.setLong(1, planId);
            ps.setString(2, d.getLineCode());
            ps.setObject(3, d.getPlanDate());
            ps.setString(4, d.getShift());
            ps.setString(5, d.getCrew());
            ps.setInt(6, d.getWorkerCount());
            ps.setString(7, d.getProductCode());
            ps.setBigDecimal(8, d.getPlannedQty());
            ps.setBigDecimal(9, d.getTaktTime());
            ps.setTimestamp(10, d.getStartTime() != null ? Timestamp.valueOf(d.getStartTime()) : null);
            ps.setTimestamp(11, d.getEndTime() != null ? Timestamp.valueOf(d.getEndTime()) : null);
            ps.setInt(12, d.getSortOrder());
            ps.setString(13, d.getRemark());
            ps.setTimestamp(14, Timestamp.valueOf(now));
            ps.setTimestamp(15, Timestamp.valueOf(now));
            ps.setString(16, currentUser);
            ps.setString(17, currentUser);
        });
    }

    private String getCurrentUser() {
        try {
            return SecurityContextHolder.getContext().getAuthentication().getName();
        } catch (Exception e) {
            return "system";
        }
    }
}
