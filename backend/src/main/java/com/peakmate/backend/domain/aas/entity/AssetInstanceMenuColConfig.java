package com.peakmate.backend.domain.aas.entity;

import com.peakmate.core.audit.AuditableEntity;
import jakarta.persistence.*;
import lombok.AccessLevel;
import lombok.Getter;
import lombok.NoArgsConstructor;
import org.hibernate.annotations.JdbcTypeCode;
import org.hibernate.type.SqlTypes;

import java.util.ArrayList;
import java.util.List;

// Q7 B안: 메뉴 단위 컬럼 설정 전역 저장 (동일 메뉴 연결 인스턴스 전체 공유)
@Getter
@Entity
@Table(name = "asset_instance_menu_col_config")
@NoArgsConstructor(access = AccessLevel.PROTECTED)
public class AssetInstanceMenuColConfig extends AuditableEntity {

    @Id
    @Column(name = "menu_code", length = 50)
    private String menuCode;

    @Column(name = "col_keys", columnDefinition = "jsonb")
    @JdbcTypeCode(SqlTypes.JSON)
    private List<ColKeyEntry> colKeys = new ArrayList<>();

    public record ColKeyEntry(int seq, String key, String label) {}

    public static AssetInstanceMenuColConfig create(String menuCode, List<ColKeyEntry> colKeys) {
        AssetInstanceMenuColConfig c = new AssetInstanceMenuColConfig();
        c.menuCode = menuCode;
        c.colKeys  = colKeys != null ? colKeys : new ArrayList<>();
        return c;
    }

    public void updateColKeys(List<ColKeyEntry> colKeys) {
        this.colKeys = colKeys != null ? colKeys : new ArrayList<>();
    }
}
