package com.peakmate.backend.interfaces.devtask.dto.response;

import java.util.List;
import java.util.Map;

public record DevTaskStatsResponse(
    int total,
    Map<String, Long> byStatus,
    List<GroupStat> byGroup
) {
    public record GroupStat(
        String group,
        String groupName,
        long total,
        long completed,
        double rate
    ) {}
}
