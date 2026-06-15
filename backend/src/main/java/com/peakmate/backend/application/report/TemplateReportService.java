package com.peakmate.backend.application.report;

import com.peakmate.backend.domain.report.entity.ReportTemplate;
import com.peakmate.backend.infra.repository.report.ReportTemplateJpaRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import net.sf.jasperreports.engine.*;
import org.springframework.core.io.ClassPathResource;
import org.springframework.stereotype.Service;

import javax.sql.DataSource;
import java.io.InputStream;
import java.sql.Connection;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;

@Slf4j
@Service
@RequiredArgsConstructor
public class TemplateReportService {

    private final ReportTemplateJpaRepository templateRepository;
    private final DataSource dataSource;

    private final ConcurrentHashMap<String, JasperReport> cache = new ConcurrentHashMap<>();

    public List<ReportTemplate> listTemplates() {
        return templateRepository.findByIsActiveOrderByCategoryAscNameAsc("Y");
    }

    public List<ReportTemplate> listByCategory(String category) {
        return templateRepository.findByCategoryAndIsActiveOrderByNameAsc(category, "Y");
    }

    public byte[] generateReport(String code, Map<String, Object> parameters) throws Exception {
        ReportTemplate template = templateRepository.findByCodeAndIsActive(code, "Y")
                .orElseThrow(() -> new IllegalArgumentException("Report template not found: " + code));

        JasperReport report = getCompiledReport(template.getJrxmlPath());

        // Convert Integer values to Long for JasperReports LONG parameters
        Map<String, Object> converted = new HashMap<>(parameters);
        for (JRParameter param : report.getParameters()) {
            if (param.isSystemDefined()) continue;
            String name = param.getName();
            Object val = converted.get(name);
            if (val instanceof Integer && param.getValueClass() == Long.class) {
                converted.put(name, ((Integer) val).longValue());
            }
        }

        try (Connection conn = dataSource.getConnection()) {
            JasperPrint print = JasperFillManager.fillReport(report, converted, conn);
            return JasperExportManager.exportReportToPdf(print);
        }
    }

    private JasperReport getCompiledReport(String jrxmlPath) throws Exception {
        return cache.computeIfAbsent(jrxmlPath, path -> {
            try {
                ClassPathResource resource = new ClassPathResource(path);
                try (InputStream is = resource.getInputStream()) {
                    return JasperCompileManager.compileReport(is);
                }
            } catch (Exception e) {
                throw new RuntimeException("Failed to compile report: " + path, e);
            }
        });
    }

    public void evictAllCache() {
        cache.clear();
    }
}
