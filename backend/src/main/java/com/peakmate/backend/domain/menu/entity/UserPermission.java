package com.peakmate.backend.domain.menu.entity;

import com.peakmate.core.audit.AuditableEntity;
import jakarta.persistence.*;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import lombok.AccessLevel;
import lombok.Getter;
import lombok.NoArgsConstructor;

/**
 * 사용자별 예외권한 엔티티.
 * 역할 기반 권한(MenuRolePermission)을 사용자 단위로 덮어쓸 수 있습니다.
 * OrbitMES의 UserPermission과 동일한 역할을 합니다.
 */
@Getter
@Entity
@Table(name = "user_permission",
        uniqueConstraints = @UniqueConstraint(columnNames = {"admin_user_id", "menu_id"}))
@NoArgsConstructor(access = AccessLevel.PROTECTED)
public class UserPermission extends AuditableEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "seq_id", nullable = false)
    private Long id;

    @NotNull
    @Column(name = "admin_user_id", nullable = false)
    private Long adminUserId;

    @NotNull
    @Column(name = "menu_id", nullable = false)
    private Long menuId;

    @Size(max = 1)
    @NotNull
    @Column(name = "can_read", length = 1, columnDefinition = "CHAR(1)", nullable = false)
    private String canRead;

    @Size(max = 1)
    @NotNull
    @Column(name = "can_create", length = 1, columnDefinition = "CHAR(1)", nullable = false)
    private String canCreate;

    @Size(max = 1)
    @NotNull
    @Column(name = "can_update", length = 1, columnDefinition = "CHAR(1)", nullable = false)
    private String canUpdate;

    @Size(max = 1)
    @NotNull
    @Column(name = "can_delete", length = 1, columnDefinition = "CHAR(1)", nullable = false)
    private String canDelete;

    @Size(max = 1)
    @NotNull
    @Column(name = "can_export", length = 1, columnDefinition = "CHAR(1)", nullable = false)
    private String canExport;

    /** PII 조회 권한 (Y/N) */
    @Size(max = 1)
    @NotNull
    @Column(name = "can_view_pii", length = 1, columnDefinition = "CHAR(1)", nullable = false)
    private String canViewPii;

    /** 승인 권한 (Y/N) */
    @Size(max = 1)
    @NotNull
    @Column(name = "can_approve", length = 1, columnDefinition = "CHAR(1)", nullable = false)
    private String canApprove;

    public static UserPermission create(Long adminUserId, Long menuId,
                                         String canRead, String canCreate,
                                         String canUpdate, String canDelete,
                                         String canExport, String canViewPii,
                                         String canApprove) {
        UserPermission p = new UserPermission();
        p.adminUserId = adminUserId;
        p.menuId = menuId;
        p.canRead = canRead;
        p.canCreate = canCreate;
        p.canUpdate = canUpdate;
        p.canDelete = canDelete;
        p.canExport = canExport;
        p.canViewPii = canViewPii;
        p.canApprove = canApprove;
        return p;
    }

    /**
     * 하나라도 'Y'인 권한이 있는지 확인합니다.
     */
    public boolean hasAnyPermission() {
        return "Y".equals(canRead) || "Y".equals(canCreate)
                || "Y".equals(canUpdate) || "Y".equals(canDelete)
                || "Y".equals(canExport) || "Y".equals(canViewPii)
                || "Y".equals(canApprove);
    }
}
