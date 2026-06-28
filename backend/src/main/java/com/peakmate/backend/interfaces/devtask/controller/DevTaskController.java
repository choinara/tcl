package com.peakmate.backend.interfaces.devtask.controller;

import com.peakmate.backend.domain.commoncode.entity.CommonCode;
import com.peakmate.backend.domain.commoncode.service.CommonCodeDomainService;
import com.peakmate.backend.domain.devtask.entity.DevTask;
import com.peakmate.backend.domain.devtask.entity.DevTaskSchedule;
import com.peakmate.backend.domain.log.service.SystemLogService;
import com.peakmate.backend.infra.repository.devtask.DevTaskJpaRepository;
import com.peakmate.backend.infra.repository.devtask.DevTaskScheduleJpaRepository;
import com.peakmate.backend.interfaces.devtask.dto.request.DevTaskBatchRequest;
import com.peakmate.backend.interfaces.devtask.dto.response.DevTaskResponse;
import com.peakmate.backend.interfaces.devtask.dto.response.DevTaskStatsResponse;
import com.peakmate.core.common.ApiResponse;
import com.peakmate.core.security.annotation.RequirePermission;
import jakarta.servlet.http.HttpServletRequest;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.util.*;
import java.util.stream.Collectors;

@Slf4j
@RestController
@RequestMapping("/api/devtask")
@RequiredArgsConstructor
public class DevTaskController {

    private final DevTaskJpaRepository devTaskRepository;
    private final DevTaskScheduleJpaRepository devTaskScheduleRepository;
    private final SystemLogService systemLogService;
    private final CommonCodeDomainService commonCodeDomainService;

    @GetMapping("/tasks")
    @RequirePermission(menu = "AD0010", action = "read")
    public ApiResponse<List<Map<String, Object>>> getTasks(
            @RequestParam(defaultValue = "Y") String useYn) {
        List<DevTask> tasks = "ALL".equals(useYn)
            ? devTaskRepository.findAllByOrderByIdAsc()
            : devTaskRepository.findByUseYnOrderByIdAsc(useYn);
        return ApiResponse.success(tasks.stream().map(DevTaskResponse::toMap).toList());
    }

    @PostMapping("/tasks/batch")
    @RequirePermission(menu = "AD0010", action = "update")
    @Transactional
    public ApiResponse<Void> batchSave(@RequestBody DevTaskBatchRequest request,
                                        HttpServletRequest httpRequest) {
        int created = 0;
        int updated = 0;
        int deleted = 0;

        for (DevTaskBatchRequest.DevTaskRow row : request.rows()) {
            String rowState = row._rowState();
            if (rowState == null) continue;

            switch (rowState) {
                case "created" -> {
                    if (row.taskCode() == null || row.taskCode().isBlank()) {
                        throw new IllegalArgumentException("과제코드는 필수입니다");
                    }
                    if (row.taskName() == null || row.taskName().isBlank()) {
                        throw new IllegalArgumentException("과제명은 필수입니다");
                    }
                    if (row.taskGroup() == null || row.taskGroup().isBlank()) {
                        throw new IllegalArgumentException("기능그룹은 필수입니다");
                    }
                    if (row.devType() == null || row.devType().isBlank()) {
                        throw new IllegalArgumentException("개발유형은 필수입니다");
                    }
                    if (devTaskRepository.findByTaskCode(row.taskCode()).isPresent()) {
                        throw new IllegalArgumentException("과제코드 중복: " + row.taskCode());
                    }
                    devTaskRepository.save(DevTask.create(
                        row.taskCode(), row.originalNo(), row.taskName(),
                        row.taskGroup(), row.devType(),
                        row.priority() != null ? row.priority() : "MEDIUM",
                        row.status() != null ? row.status() : "PENDING",
                        row.phase(), null
                    ));
                    created++;
                }
                case "updated" -> {
                    DevTask task = devTaskRepository.findById(row.id())
                        .orElseThrow(() -> new IllegalArgumentException("존재하지 않는 과제: " + row.id()));
                    task.update(
                        row.taskName(), row.taskGroup(), row.devType(),
                        row.priority(), row.status(), row.phase(), row.assignee(),
                        row.relatedMenuCode(), row.description(), row.completionCriteria(),
                        row.plannedStart(), row.plannedEnd(),
                        parseDate(row.actualStartDate()), parseDate(row.actualEndDate()),
                        row.progress() != null ? row.progress() : task.getProgress(),
                        row.remarks(),
                        row.useYn() != null ? row.useYn() : task.getUseYn()
                    );
                    updated++;
                }
                case "deleted" -> {
                    devTaskRepository.findById(row.id()).ifPresent(t -> {
                        t.update(t.getTaskName(), t.getTaskGroup(), t.getDevType(),
                            t.getPriority(), t.getStatus(), t.getPhase(), t.getAssignee(),
                            t.getRelatedMenuCode(), t.getDescription(), t.getCompletionCriteria(),
                            t.getPlannedStart(), t.getPlannedEnd(),
                            t.getActualStartDate(), t.getActualEndDate(),
                            t.getProgress(), t.getRemarks(), "N");
                    });
                    deleted++;
                }
                default -> { /* unknown state, skip */ }
            }
        }

        try {
            Authentication auth = SecurityContextHolder.getContext().getAuthentication();
            String username = (auth != null) ? auth.getName() : "unknown";
            String ipAddress = httpRequest.getRemoteAddr();
            String detail = String.format("생성 %d건, 수정 %d건, 삭제 %d건", created, updated, deleted);
            systemLogService.log("DATA_CHANGE", null, username, ipAddress, "과제 일괄 저장", detail);
        } catch (Exception e) {
            log.warn("[시스템 로그 기록 실패] 과제 일괄 저장", e);
        }

        return ApiResponse.success("일괄 저장되었습니다");
    }

    @GetMapping("/tasks/stats")
    @RequirePermission(menu = "AD0010", action = "read")
    public ApiResponse<DevTaskStatsResponse> getStats() {
        List<DevTask> all = devTaskRepository.findByUseYnOrderByIdAsc("Y");

        Map<String, Long> byStatus = all.stream()
            .collect(Collectors.groupingBy(DevTask::getStatus, Collectors.counting()));

        // Build group code -> group name mapping from common codes
        Map<String, String> groupNameMap = new HashMap<>();
        try {
            List<CommonCode> groupCodes = commonCodeDomainService.getCodesByGroup("TASK_GROUP");
            for (CommonCode cc : groupCodes) {
                groupNameMap.put(cc.getCode(), cc.getCodeName());
            }
        } catch (Exception e) {
            log.warn("TASK_GROUP 공통코드 조회 실패", e);
        }

        Map<String, List<DevTask>> grouped = all.stream()
            .collect(Collectors.groupingBy(DevTask::getTaskGroup));

        List<DevTaskStatsResponse.GroupStat> byGroup = grouped.entrySet().stream()
            .sorted(Map.Entry.comparingByKey())
            .map(entry -> {
                String groupCode = entry.getKey();
                List<DevTask> tasks = entry.getValue();
                long total = tasks.size();
                long completed = tasks.stream()
                    .filter(t -> "COMPLETED".equals(t.getStatus()))
                    .count();
                double rate = total > 0 ? Math.round(completed * 1000.0 / total) / 10.0 : 0.0;
                String groupName = groupNameMap.getOrDefault(groupCode, groupCode);
                return new DevTaskStatsResponse.GroupStat(groupCode, groupName, total, completed, rate);
            })
            .toList();

        return ApiResponse.success(new DevTaskStatsResponse(all.size(), byStatus, byGroup));
    }

    @GetMapping("/schedules")
    @RequirePermission(menu = "AD0010", action = "read")
    public ApiResponse<List<Map<String, Object>>> getSchedules() {
        List<DevTaskSchedule> schedules = devTaskScheduleRepository.findAll();
        List<Map<String, Object>> result = schedules.stream().map(s -> {
            Map<String, Object> m = new LinkedHashMap<>();
            m.put("id", s.getId());
            m.put("taskCode", s.getTaskCode());
            m.put("stageCode", s.getStageCode());
            m.put("stageStart", s.getStageStart() != null ? s.getStageStart().toString() : null);
            m.put("stageEnd", s.getStageEnd() != null ? s.getStageEnd().toString() : null);
            return m;
        }).toList();
        return ApiResponse.success(result);
    }

    private LocalDate parseDate(String s) {
        if (s == null || s.isBlank()) return null;
        try {
            return LocalDate.parse(s);
        } catch (Exception e) {
            return null;
        }
    }
}
