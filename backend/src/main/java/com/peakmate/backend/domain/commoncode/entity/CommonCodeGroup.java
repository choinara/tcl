package com.peakmate.backend.domain.commoncode.entity;

import com.peakmate.core.audit.AuditableEntity;
import jakarta.persistence.*;
import lombok.AccessLevel;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import org.hibernate.annotations.ColumnDefault;

/**
 * COMMON_CODE_GROUP 엔티티
 * 공통코드 그룹 정보
 */
@Getter
@Entity
@Table(name = "common_code_group")
@NoArgsConstructor(access = AccessLevel.PROTECTED)
public class CommonCodeGroup extends AuditableEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "seq_id", nullable = false)
    private Long id;

    @Column(name = "group_code", nullable = false, length = 50)
    private String groupCode;

    @Column(name = "group_name", nullable = false, length = 200)
    private String groupName;

    @Column(name = "description", length = 500)
    private String description;

    @ColumnDefault("'Y'")
    @Column(name = "use_yn", nullable = false, length = 1, columnDefinition = "CHAR(1)")
    private String useYn;

    @Column(name = "sort_order")
    private Integer sortOrder;

    @Column(name = "extra1_label", length = 100)
    private String extra1Label;

    @Column(name = "extra2_label", length = 100)
    private String extra2Label;

    @Builder
    private CommonCodeGroup(String groupCode, String groupName, String description,
                             String useYn, Integer sortOrder,
                             String extra1Label, String extra2Label) {
        this.groupCode = groupCode;
        this.groupName = groupName;
        this.description = description;
        this.useYn = useYn;
        this.sortOrder = sortOrder;
        this.extra1Label = extra1Label;
        this.extra2Label = extra2Label;
    }

    /**
     * 공통코드 그룹 생성 (정적 팩토리 메서드)
     */
    public static CommonCodeGroup create(String groupCode, String groupName, String description,
                                         Integer sortOrder, String extra1Label, String extra2Label) {
        return CommonCodeGroup.builder()
            .groupCode(groupCode)
            .groupName(groupName)
            .description(description)
            .useYn("Y")
            .sortOrder(sortOrder)
            .extra1Label(extra1Label)
            .extra2Label(extra2Label)
            .build();
    }

    /**
     * 공통코드 그룹 수정
     */
    public void update(String groupCode, String groupName, String description,
                       String useYn, Integer sortOrder, String extra1Label, String extra2Label) {
        this.groupCode = groupCode;
        this.groupName = groupName;
        this.description = description;
        this.useYn = useYn;
        this.sortOrder = sortOrder;
        this.extra1Label = extra1Label;
        this.extra2Label = extra2Label;
    }
}
