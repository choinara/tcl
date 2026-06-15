package com.peakmate.backend.domain.admin.entity;

import com.peakmate.core.audit.AuditableEntity;
import jakarta.persistence.*;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import lombok.Getter;

@Getter
@Entity
@Table(name = "team_info")
public class TeamInfo extends AuditableEntity {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "seq_id", nullable = false)
    private Long id;

    @Column(name = "parent_id")
    private Long parentId;

    @Convert(converter = TeamCodeConverter.class)
    @Column(name = "code", length = 50, nullable = false)
    private TeamCode code;

    @Size(max = 100)
    @Column(name = "name", length = 100)
    private String name;

    @Size(max = 1)
    @NotNull
    @Column(name = "is_active", nullable = false, length = 1)
    private String isActive;

    @Column(name = "sort_order")
    private Long sortOrder;

}