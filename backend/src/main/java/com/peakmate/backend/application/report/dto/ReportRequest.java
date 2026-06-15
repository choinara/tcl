package com.peakmate.backend.application.report.dto;

import lombok.Getter;
import lombok.Setter;
import java.util.List;
import java.util.Map;

@Getter
@Setter
public class ReportRequest {
    private String title;
    private String format; // "PDF" or "XLSX"
    private List<ReportColumn> columns;
    private List<Map<String, Object>> data;
}
