package com.peakmate.backend.domain.admin.entity;

import com.peakmate.core.audit.AuditableEntity;
import jakarta.persistence.*;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import lombok.Getter;
import lombok.Setter;

@Getter
@Entity
@Table(name = "admin_role")
public class AdminRole extends AuditableEntity {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "seq_id", nullable = false)
    private Long id;

    @Column(name = "role_code", length = 50, nullable = false, unique = true)
    private String roleCode;

    @Size(max = 100)
    @Column(name = "role_name", length = 100)
    private String name;

    @Size(max = 500)
    @Column(name = "description", length = 500)
    private String description;

    protected AdminRole() {
    }

    public static AdminRole create(String roleCode, String name, String description) {
        AdminRole role = new AdminRole();
        role.roleCode = roleCode;
        role.name = name;
        role.description = description;
        return role;
    }

    /**
     * 역할명 변경
     */
    public void updateName(String name) {
        this.name = name;
    }

    public void updateInfo(String roleCode, String name, String description) {
        this.roleCode = roleCode;
        this.name = name;
        this.description = description;
    }

}