package com.peakmate.backend.interfaces.devtask.dto.request;

import java.util.List;

public record DevTaskBatchRequest(List<DevTaskRow> rows) {
    public record DevTaskRow(
        Long id,
        String taskCode,
        String originalNo,
        String taskName,
        String taskGroup,
        String devType,
        String priority,
        String status,
        String phase,
        String assignee,
        String relatedMenuCode,
        String description,
        String completionCriteria,
        String plannedStart,
        String plannedEnd,
        String actualStartDate,
        String actualEndDate,
        Integer progress,
        String remarks,
        String useYn,
        String _rowState
    ) {}
}
