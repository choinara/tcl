package com.peakmate.backend.domain.organization.entity;

import com.peakmate.core.audit.AuditableEntity;
import jakarta.persistence.*;
import lombok.Getter;

@Getter
@Entity
@Table(name = "position")
public class Position extends AuditableEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "seq_id")
    private Long id;

    @Column(name = "position_code", length = 50, nullable = false, unique = true)
    private String positionCode;

    @Column(name = "position_name", length = 100, nullable = false)
    private String positionName;

    @Column(name = "position_level", nullable = false)
    private Integer positionLevel = 1;

    @Column(name = "sort_order", nullable = false)
    private Integer sortOrder = 0;

    @Column(name = "is_active", length = 1, nullable = false)
    private String isActive = "Y";

    public static Position create(String positionCode, String positionName,
                                  Integer positionLevel, Integer sortOrder) {
        Position p = new Position();
        p.positionCode = positionCode;
        p.positionName = positionName;
        p.positionLevel = positionLevel != null ? positionLevel : 1;
        p.sortOrder = sortOrder != null ? sortOrder : 0;
        p.isActive = "Y";
        return p;
    }

    public void update(String positionName, Integer positionLevel, Integer sortOrder, String isActive) {
        this.positionName = positionName;
        if (positionLevel != null) this.positionLevel = positionLevel;
        if (sortOrder != null) this.sortOrder = sortOrder;
        if (isActive != null) this.isActive = isActive;
    }
}
