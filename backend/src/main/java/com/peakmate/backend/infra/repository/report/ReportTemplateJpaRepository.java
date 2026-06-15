package com.peakmate.backend.infra.repository.report;

import com.peakmate.backend.domain.report.entity.ReportTemplate;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface ReportTemplateJpaRepository extends JpaRepository<ReportTemplate, Long> {
    Optional<ReportTemplate> findByCodeAndIsActive(String code, String isActive);
    List<ReportTemplate> findByIsActiveOrderByCategoryAscNameAsc(String isActive);
    List<ReportTemplate> findByCategoryAndIsActiveOrderByNameAsc(String category, String isActive);
}
