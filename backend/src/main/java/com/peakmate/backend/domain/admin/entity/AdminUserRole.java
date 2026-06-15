package com.peakmate.backend.domain.admin.entity;

import com.peakmate.core.audit.AuditableEntity;
import jakarta.persistence.*;
import jakarta.validation.constraints.NotNull;
import lombok.Getter;
import lombok.Setter;

@Getter
@Entity
@Table(name = "admin_user_role")
public class AdminUserRole extends AuditableEntity {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "seq_id", nullable = false)
    private Long id;

    @Column(name = "admin_user_id")
    private Long adminUserId;

    @Column(name = "admin_role_id")
    private Long adminRoleId;

    /**
     * AdminUser와 AdminRole 매핑 생성을 위한 정적 팩토리 메서드
     */
    public static AdminUserRole of(Long adminUserId, Long adminRoleId) {
        AdminUserRole userRole = new AdminUserRole();
        userRole.adminUserId = adminUserId;
        userRole.adminRoleId = adminRoleId;
        return userRole;
    }
}