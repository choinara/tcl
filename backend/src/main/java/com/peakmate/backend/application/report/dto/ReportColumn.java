package com.peakmate.backend.application.report.dto;

import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class ReportColumn {
    private String field;
    private String headerName;
    private int width;
}
