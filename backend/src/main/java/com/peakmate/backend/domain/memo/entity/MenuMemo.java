package com.peakmate.backend.domain.memo.entity;

import com.peakmate.core.audit.AuditableEntity;
import jakarta.persistence.*;
import lombok.Getter;

@Getter
@Entity
@Table(name = "menu_memo")
public class MenuMemo extends AuditableEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "seq_id")
    private Long id;

    @Column(name = "menu_code", length = 20, nullable = false)
    private String menuCode;

    @Column(name = "author", length = 100, nullable = false)
    private String author;

    @Column(name = "content", columnDefinition = "TEXT", nullable = false)
    private String content;

    protected MenuMemo() {}

    public void updateContent(String content) {
        this.content = content;
    }

    public static MenuMemo create(String menuCode, String author, String content) {
        MenuMemo memo = new MenuMemo();
        memo.menuCode = menuCode;
        memo.author = author;
        memo.content = content;
        return memo;
    }
}
