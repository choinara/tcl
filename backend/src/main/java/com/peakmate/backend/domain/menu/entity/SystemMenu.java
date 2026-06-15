package com.peakmate.backend.domain.menu.entity;

import com.peakmate.core.audit.AuditableEntity;
import jakarta.persistence.*;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import lombok.AccessLevel;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;

/**
 * 시스템 메뉴 엔티티.
 * 메뉴 트리를 구성하는 단위 노드입니다.
 * parentId가 null이면 최상위 메뉴입니다.
 */
@Getter
@Entity
@Table(name = "system_menu")
@NoArgsConstructor(access = AccessLevel.PROTECTED)
public class SystemMenu extends AuditableEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "seq_id", nullable = false)
    private Long id;

    /** FK -> SYSTEM_MENU.SEQ_ID (부모 메뉴, null이면 최상위) */
    @Column(name = "parent_id")
    private Long parentId;

    @Size(max = 50)
    @NotNull
    @Column(name = "menu_code", length = 50, nullable = false)
    private String menuCode;

    @Size(max = 200)
    @NotNull
    @Column(name = "menu_name", length = 200, nullable = false)
    private String menuName;

    @Size(max = 500)
    @Column(name = "menu_path", length = 500)
    private String menuPath;

    @Size(max = 100)
    @Column(name = "icon", length = 100)
    private String icon;

    @NotNull
    @Column(name = "sort_order", nullable = false)
    private Integer sortOrder;

    /** 사용 여부 (Y/N) */
    @Size(max = 1)
    @NotNull
    @Column(name = "use_yn", length = 1, columnDefinition = "CHAR(1)", nullable = false)
    private String useYn;

    @NotNull
    @Column(name = "menu_level", nullable = false)
    private Integer menuLevel;

    @Builder
    public SystemMenu(Long parentId, String menuCode, String menuName, String menuPath,
                      String icon, Integer sortOrder, String useYn, Integer menuLevel) {
        this.parentId = parentId;
        this.menuCode = menuCode;
        this.menuName = menuName;
        this.menuPath = menuPath;
        this.icon = icon;
        this.sortOrder = sortOrder;
        this.useYn = useYn;
        this.menuLevel = menuLevel;
    }

    /**
     * 메뉴 정보를 수정합니다.
     */
    public void update(String menuCode, String menuName, String menuPath,
                       Long parentId, Integer sortOrder, String icon, String useYn) {
        this.menuCode = menuCode;
        this.menuName = menuName;
        this.menuPath = menuPath;
        this.parentId = parentId;
        this.sortOrder = sortOrder;
        this.icon = icon;
        this.useYn = useYn;
        this.menuLevel = (parentId == null) ? 1 : 2;
    }
}
