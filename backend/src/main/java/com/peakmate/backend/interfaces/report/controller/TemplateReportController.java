package com.peakmate.backend.interfaces.report.controller;

import com.peakmate.backend.application.report.TemplateReportService;
import com.peakmate.backend.domain.report.entity.ReportTemplate;
import com.peakmate.core.common.ApiResponse;
import com.peakmate.core.security.annotation.RequirePermission;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.*;
import org.springframework.web.bind.annotation.*;

import java.net.URLEncoder;
import java.nio.charset.StandardCharsets;
import java.util.List;
import java.util.Map;

@Slf4j
@RestController
@RequestMapping("/api/reports")
@RequiredArgsConstructor
public class TemplateReportController {

    private final TemplateReportService templateReportService;

    @RequirePermission(menu = "UT0020", action = "read")
    @GetMapping("/templates")
    public ApiResponse<List<ReportTemplate>> listTemplates(
            @RequestParam(required = false) String category) {
        List<ReportTemplate> list = (category != null && !category.isBlank())
                ? templateReportService.listByCategory(category)
                : templateReportService.listTemplates();
        return ApiResponse.success(list);
    }

    @RequirePermission(menu = "UT0020", action = "create")
    @PostMapping("/generate/{code}")
    public ResponseEntity<byte[]> generate(
            @PathVariable String code,
            @RequestBody(required = false) Map<String, Object> parameters) {
        try {
            byte[] pdf = templateReportService.generateReport(
                    code, parameters != null ? parameters : Map.of());
            String encodedName = URLEncoder.encode(code + ".pdf", StandardCharsets.UTF_8)
                    .replace("+", "%20");
            return ResponseEntity.ok()
                    .header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename*=UTF-8''" + encodedName)
                    .contentType(MediaType.APPLICATION_PDF)
                    .contentLength(pdf.length)
                    .body(pdf);
        } catch (IllegalArgumentException e) {
            return ResponseEntity.notFound().build();
        } catch (Exception e) {
            log.error("Report generation failed: {}", code, e);
            return ResponseEntity.internalServerError().build();
        }
    }

    @RequirePermission(menu = "UT0020", action = "create")
    @PostMapping("/cache/clear")
    public ApiResponse<Void> clearCache() {
        templateReportService.evictAllCache();
        return ApiResponse.success("캐시가 초기화되었습니다");
    }
}
