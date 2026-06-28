package com.peakmate.backend.interfaces.devtask.dto.response;

import com.peakmate.backend.domain.devtask.entity.DevTask;

import java.util.LinkedHashMap;
import java.util.Map;

public class DevTaskResponse {

    private DevTaskResponse() {
    }

    public static Map<String, Object> toMap(DevTask t) {
        Map<String, Object> m = new LinkedHashMap<>();
        m.put("id", t.getId());
        m.put("taskCode", t.getTaskCode());
        m.put("originalNo", t.getOriginalNo());
        m.put("taskName", t.getTaskName());
        m.put("taskGroup", t.getTaskGroup());
        m.put("devType", t.getDevType());
        m.put("priority", t.getPriority());
        m.put("status", t.getStatus());
        m.put("phase", t.getPhase());
        m.put("proposer", t.getProposer());
        m.put("assignee", t.getAssignee());
        m.put("relatedMenuCode", t.getRelatedMenuCode());
        m.put("description", t.getDescription());
        m.put("completionCriteria", t.getCompletionCriteria());
        m.put("plannedStart", t.getPlannedStart());
        m.put("plannedEnd", t.getPlannedEnd());
        m.put("actualStartDate", t.getActualStartDate());
        m.put("actualEndDate", t.getActualEndDate());
        m.put("progress", t.getProgress());
        m.put("remarks", t.getRemarks());
        m.put("useYn", t.getUseYn());
        m.put("createdAt", t.getCreatedAt());
        m.put("updatedAt", t.getUpdatedAt());
        return m;
    }
}
