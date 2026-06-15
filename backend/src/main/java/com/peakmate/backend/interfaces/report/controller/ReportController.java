package com.peakmate.backend.interfaces.report.controller;

import com.peakmate.backend.application.report.JasperReportService;
import com.peakmate.backend.application.report.dto.ReportRequest;
import com.peakmate.core.security.annotation.RequirePermission;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.net.URLEncoder;
import java.nio.charset.StandardCharsets;

@Slf4j
@RestController
@RequestMapping("/api/report")
@RequiredArgsConstructor
public class ReportController {

    private final JasperReportService jasperReportService;

    @RequirePermission(menu = "UT0020", action = "create")
    @PostMapping("/generate")
    public ResponseEntity<byte[]> generate(@RequestBody ReportRequest request) {
        try {
            byte[] output = jasperReportService.generateListReport(request);
            String format = request.getFormat() != null ? request.getFormat().toUpperCase() : "PDF";
            boolean isXlsx = "XLSX".equals(format);

            String title = request.getTitle() != null ? request.getTitle() : "report";
            String extension = isXlsx ? ".xlsx" : ".pdf";
            String encodedName = URLEncoder.encode(title + extension, StandardCharsets.UTF_8)
                    .replace("+", "%20");

            MediaType mediaType = isXlsx
                    ? MediaType.parseMediaType("application/vnd.openxmlformats-officedocument.spreadsheetml.sheet")
                    : MediaType.APPLICATION_PDF;

            return ResponseEntity.ok()
                    .header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename*=UTF-8''" + encodedName)
                    .contentType(mediaType)
                    .contentLength(output.length)
                    .body(output);
        } catch (Exception e) {
            log.error("Report generation failed", e);
            return ResponseEntity.internalServerError().build();
        }
    }
}
