package com.peakmate.backend.domain.menu.entity;

import com.peakmate.core.audit.AuditableEntity;
import jakarta.persistence.*;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import lombok.Getter;

/**
 * 메뉴-역할 권한 매핑 엔티티.
 * 특정 역할(AdminRole)이 특정 메뉴에 대해 갖는 권한을 정의합니다.
 * FK -> SYSTEM_MENU.SEQ_ID, FK -> ADMIN_ROLE.SEQ_ID
 */
@Getter
@Entity
@Table(name = "menu_role_permission")
public class MenuRolePermission extends AuditableEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "seq_id", nullable = false)
    private Long id;

    /** FK -> SYSTEM_MENU.SEQ_ID */
    @NotNull
    @Column(name = "menu_id", nullable = false)
    private Long menuId;

    /** FK -> ADMIN_ROLE.SEQ_ID */
    @NotNull
    @Column(name = "admin_role_id", nullable = false)
    private Long adminRoleId;

    /** 조회 권한 (Y/N) */
    @Size(max = 1)
    @NotNull
    @Column(name = "can_read", length = 1, columnDefinition = "CHAR(1)", nullable = false)
    private String canRead;

    /** 생성 권한 (Y/N) */
    @Size(max = 1)
    @NotNull
    @Column(name = "can_create", length = 1, columnDefinition = "CHAR(1)", nullable = false)
    private String canCreate;

    /** 수정 권한 (Y/N) */
    @Size(max = 1)
    @NotNull
    @Column(name = "can_update", length = 1, columnDefinition = "CHAR(1)", nullable = false)
    private String canUpdate;

    /** 삭제 권한 (Y/N) */
    @Size(max = 1)
    @NotNull
    @Column(name = "can_delete", length = 1, columnDefinition = "CHAR(1)", nullable = false)
    private String canDelete;

    /** 내보내기 권한 (Y/N) */
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

    public static MenuRolePermission create(Long menuId, Long adminRoleId,
                                             String canRead, String canCreate,
                                             String canUpdate, String canDelete,
                                             String canExport, String canViewPii,
                                             String canApprove) {
        MenuRolePermission p = new MenuRolePermission();
        p.menuId = menuId;
        p.adminRoleId = adminRoleId;
        p.canRead = canRead;
        p.canCreate = canCreate;
        p.canUpdate = canUpdate;
        p.canDelete = canDelete;
        p.canExport = canExport;
        p.canViewPii = canViewPii;
        p.canApprove = canApprove;
        return p;
    }
}
