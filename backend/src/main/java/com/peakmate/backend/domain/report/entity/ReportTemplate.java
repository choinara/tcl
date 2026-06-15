package com.peakmate.backend.domain.report.entity;

import com.peakmate.core.audit.AuditableEntity;
import jakarta.persistence.*;
import lombok.Getter;

@Getter
@Entity
@Table(name = "report_template")
public class ReportTemplate extends AuditableEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "seq_id")
    private Long id;

    @Column(nullable = false, unique = true, length = 50)
    private String code;

    @Column(nullable = false, length = 200)
    private String name;

    private String description;

    @Column(nullable = false, length = 50)
    private String category;

    @Column(name = "jrxml_path", nullable = false, length = 300)
    private String jrxmlPath;

    @Column(name = "parameters_json", columnDefinition = "TEXT")
    private String parametersJson;

    @Column(name = "is_active", length = 1, nullable = false)
    private String isActive = "Y";

    public static ReportTemplate create(String code, String name, String description,
            String category, String jrxmlPath, String parametersJson) {
        ReportTemplate t = new ReportTemplate();
        t.code = code;
        t.name = name;
        t.description = description;
        t.category = category;
        t.jrxmlPath = jrxmlPath;
        t.parametersJson = parametersJson;
        t.isActive = "Y";
        return t;
    }

    public void update(String name, String description, String category,
            String jrxmlPath, String parametersJson) {
        this.name = name;
        this.description = description;
        this.category = category;
        this.jrxmlPath = jrxmlPath;
        this.parametersJson = parametersJson;
    }
}
