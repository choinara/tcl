package com.peakmate.backend.interfaces.aps.controller;

import com.peakmate.backend.application.aps.dto.command.AdjustPlanCommand;
import com.peakmate.backend.application.aps.dto.command.RunPlanningCommand;
import com.peakmate.backend.application.aps.dto.result.PlanningResult;
import com.peakmate.backend.application.aps.facade.ApsFacade;
import com.peakmate.backend.domain.aps.entity.ApsPlan;
import com.peakmate.backend.domain.aps.entity.ApsScheduleDraft;
import com.peakmate.backend.interfaces.aps.dto.request.AdjustPlanRequest;
import com.peakmate.backend.interfaces.aps.dto.request.RunPlanningRequest;
import com.peakmate.backend.interfaces.aps.dto.response.ApsPlanResponse;
import com.peakmate.backend.interfaces.aps.dto.response.ApsScheduleResponse;
import com.peakmate.backend.interfaces.aps.dto.response.ConstraintResultResponse;
import com.peakmate.backend.infra.repository.aps.ApsPlanJpaRepository;
import com.peakmate.backend.infra.repository.aps.ApsScheduleDraftJpaRepository;
import com.peakmate.core.common.ApiResponse;
import com.peakmate.core.error.EntityNotFoundException;
import com.peakmate.core.log.SystemLog;
import com.peakmate.core.security.annotation.RequirePermission;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

/**
 * APS 계획 실행/조회/조정/확정/취소/수정 API.
 */
@RestController
@RequestMapping("/api/aps/plans")
@RequiredArgsConstructor
public class ApsController {

    private final ApsFacade apsFacade;
    private final ApsPlanJpaRepository planRepository;
    private final ApsScheduleDraftJpaRepository draftRepository;

    @RequirePermission(menu = "PM0040", action = "create")
    @PostMapping("/run")
    public ApiResponse<ApsPlanResponse> runPlanning(@Valid @RequestBody RunPlanningRequest request) {
        RunPlanningCommand command = new RunPlanningCommand(
                LocalDate.parse(request.periodStart()),
                LocalDate.parse(request.periodEnd()),
                request.lineCodes()
        );

        PlanningResult result = apsFacade.runPlanning(command);

        ConstraintResultResponse constraintResponse = ConstraintResultResponse.from(result.constraintResult());
        ApsPlan plan = planRepository.findById(result.planId())
                .orElseThrow(() -> new EntityNotFoundException("계획을 찾을 수 없습니다."));

        return ApiResponse.success(ApsPlanResponse.from(plan, result.schedules().size(), constraintResponse));
    }

    @RequirePermission(menu = "PM0040", action = "read")
    @GetMapping
    public ApiResponse<Map<String, Object>> listPlans(
            @RequestParam(required = false) String status,
            @RequestParam(required = false) String startDate,
            @RequestParam(required = false) String endDate) {

        List<ApsPlan> plans;
        if (status != null && !status.isBlank()) {
            plans = planRepository.findByStatusOrderByCreatedAtDesc(status);
        } else if (startDate != null && endDate != null) {
            plans = planRepository.findByPeriodStartBetweenOrderByCreatedAtDesc(
                    LocalDate.parse(startDate), LocalDate.parse(endDate));
        } else {
            plans = planRepository.findAll().stream()
                    .sorted((a, b) -> b.getCreatedAt().compareTo(a.getCreatedAt()))
                    .collect(Collectors.toList());
        }

        List<Map<String, Object>> content = plans.stream().map(plan -> {
            Map<String, Object> map = new LinkedHashMap<>();
            map.put("planId", plan.getId());
            map.put("periodStart", plan.getPeriodStart());
            map.put("periodEnd", plan.getPeriodEnd());
            map.put("lineCodes", plan.getLineCodes());
            map.put("status", plan.getStatus());
            map.put("scheduleCount", draftRepository.countByPlanId(plan.getId()));
            map.put("createdAt", plan.getCreatedAt());
            map.put("createdBy", plan.getCreatedBy());
            return map;
        }).toList();

        Map<String, Object> response = new LinkedHashMap<>();
        response.put("content", content);
        response.put("totalElements", content.size());
        return ApiResponse.success(response);
    }

    @RequirePermission(menu = "PM0040", action = "read")
    @GetMapping("/{planId}")
    public ApiResponse<ApsPlanResponse> getPlan(@PathVariable Long planId) {
        ApsPlan plan = planRepository.findById(planId)
                .orElseThrow(() -> new EntityNotFoundException("계획을 찾을 수 없습니다. planId=" + planId));
        long count = draftRepository.countByPlanId(planId);
        return ApiResponse.success(ApsPlanResponse.from(plan, count, null));
    }

    @RequirePermission(menu = "PM0040", action = "read")
    @GetMapping("/{planId}/schedules")
    public ApiResponse<Map<String, Object>> getSchedules(
            @PathVariable Long planId,
            @RequestParam(required = false) String lineCode) {

        List<ApsScheduleDraft> drafts;
        if (lineCode != null && !lineCode.isBlank()) {
            drafts = draftRepository.findByPlanIdAndLineCodeOrderByPlanDateAscSortOrderAsc(planId, lineCode);
        } else {
            drafts = draftRepository.findByPlanIdOrderBySortOrderAsc(planId);
        }

        List<ApsScheduleResponse> content = drafts.stream()
                .map(ApsScheduleResponse::from)
                .toList();

        Map<String, Object> response = new LinkedHashMap<>();
        response.put("content", content);
        response.put("totalElements", content.size());
        return ApiResponse.success(response);
    }

    @RequirePermission(menu = "PM0040", action = "update")
    @PostMapping("/{planId}/adjust")
    public ApiResponse<Void> adjustPlan(
            @PathVariable Long planId,
            @Valid @RequestBody AdjustPlanRequest request) {

        AdjustPlanCommand command = new AdjustPlanCommand(
                planId,
                request.adjustments().stream()
                        .map(a -> new AdjustPlanCommand.AdjustmentItem(
                                a.draftId(), a.plannedQty(), a.lineCode(),
                                a.shift(), a.crew(), a.workerCount(), a.remark()))
                        .toList()
        );

        apsFacade.adjustPlan(command);
        return ApiResponse.success("수동 조정이 반영되었습니다.");
    }

    @RequirePermission(menu = "PM0040", action = "approve")
    @PostMapping("/{planId}/commit")
    @SystemLog(type = "APPROVAL", action = "APS 계획 확정", detail = "'planId=' + #planId")
    public ApiResponse<Void> commitPlan(@PathVariable Long planId) {
        apsFacade.commitPlan(planId);
        return ApiResponse.success("계획이 확정되었습니다.");
    }

    @RequirePermission(menu = "PM0040", action = "approve")
    @PostMapping("/{planId}/cancel")
    @SystemLog(type = "APPROVAL_CANCEL", action = "APS 계획 취소", detail = "'planId=' + #planId")
    public ApiResponse<Void> cancelPlan(@PathVariable Long planId) {
        apsFacade.cancelPlan(planId);
        return ApiResponse.success("계획이 취소되었습니다.");
    }

    @RequirePermission(menu = "PM0040", action = "create")
    @PostMapping("/{planId}/revise")
    public ApiResponse<ApsPlanResponse> revisePlan(@PathVariable Long planId) {
        PlanningResult result = apsFacade.revisePlan(planId);

        ConstraintResultResponse constraintResponse = ConstraintResultResponse.from(result.constraintResult());
        ApsPlan plan = planRepository.findById(result.planId())
                .orElseThrow(() -> new EntityNotFoundException("계획을 찾을 수 없습니다."));

        return ApiResponse.success(ApsPlanResponse.from(plan, result.schedules().size(), constraintResponse));
    }
}
