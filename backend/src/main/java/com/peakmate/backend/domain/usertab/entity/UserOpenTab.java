package com.peakmate.backend.domain.usertab.entity;

import com.peakmate.core.audit.AuditableEntity;
import jakarta.persistence.*;
import lombok.AccessLevel;
import lombok.Getter;
import lombok.NoArgsConstructor;

/**
 * 사용자별 열린 탭 세션 엔티티.
 * 재로그인/새로고침 시 마지막 작업 탭 상태를 복원하기 위해 사용.
 */
@Entity
@Table(name = "user_open_tab")
@Getter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
public class UserOpenTab extends AuditableEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "seq_id")
    private Long id;

    @Column(name = "admin_user_id", nullable = false)
    private Long adminUserId;

    @Column(name = "tab_path", nullable = false, length = 500)
    private String tabPath;

    @Column(name = "menu_code", length = 20)
    private String menuCode;

    @Column(name = "sort_order", nullable = false)
    private Integer sortOrder;

    @Column(name = "is_active", nullable = false)
    private Boolean isActive;

    @Column(name = "label", length = 200)
    private String label;

    /**
     * 새 탭 엔티티를 생성합니다.
     */
    public static UserOpenTab create(Long adminUserId, String tabPath, String menuCode,
                                      int sortOrder, boolean isActive, String label) {
        UserOpenTab tab = new UserOpenTab();
        tab.adminUserId = adminUserId;
        tab.tabPath = tabPath;
        tab.menuCode = menuCode;
        tab.sortOrder = sortOrder;
        tab.isActive = isActive;
        tab.label = label;
        return tab;
    }
}
