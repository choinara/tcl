package com.peakmate.backend.domain.commoncode.entity;

import com.peakmate.core.audit.AuditableEntity;
import jakarta.persistence.*;
import lombok.AccessLevel;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import org.hibernate.annotations.ColumnDefault;

/**
 * COMMON_CODE 엔티티
 * 공통코드 상세 항목
 * groupId -> COMMON_CODE_GROUP.SEQ_ID (논리적 FK)
 */
@Getter
@Entity
@Table(name = "common_code")
@NoArgsConstructor(access = AccessLevel.PROTECTED)
public class CommonCode extends AuditableEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "seq_id", nullable = false)
    private Long id;

    /** FK -> COMMON_CODE_GROUP.SEQ_ID (논리적 참조, JPA 연관관계 미사용) */
    @Column(name = "group_id", nullable = false)
    private Long groupId;

    @Column(name = "code", nullable = false, length = 50)
    private String code;

    @Column(name = "code_name", nullable = false, length = 200)
    private String codeName;

    @Column(name = "code_desc", length = 500)
    private String codeDesc;

    @ColumnDefault("'Y'")
    @Column(name = "use_yn", nullable = false, length = 1, columnDefinition = "CHAR(1)")
    private String useYn;

    @Column(name = "sort_order")
    private Integer sortOrder;

    @Column(name = "extra1", length = 500)
    private String extra1;

    @Column(name = "extra2", length = 500)
    private String extra2;

    @Builder
    private CommonCode(Long groupId, String code, String codeName, String codeDesc,
                       String useYn, Integer sortOrder, String extra1, String extra2) {
        this.groupId = groupId;
        this.code = code;
        this.codeName = codeName;
        this.codeDesc = codeDesc;
        this.useYn = useYn;
        this.sortOrder = sortOrder;
        this.extra1 = extra1;
        this.extra2 = extra2;
    }

    /**
     * 공통코드 생성 (정적 팩토리 메서드)
     */
    public static CommonCode create(Long groupId, String code, String codeName,
                                    String codeDesc, Integer sortOrder,
                                    String extra1, String extra2) {
        return CommonCode.builder()
            .groupId(groupId)
            .code(code)
            .codeName(codeName)
            .codeDesc(codeDesc)
            .useYn("Y")
            .sortOrder(sortOrder)
            .extra1(extra1)
            .extra2(extra2)
            .build();
    }

    /**
     * 공통코드 수정
     */
    public void update(String code, String codeName, String codeDesc,
                       String useYn, Integer sortOrder, String extra1, String extra2) {
        this.code = code;
        this.codeName = codeName;
        this.codeDesc = codeDesc;
        this.useYn = useYn;
        this.sortOrder = sortOrder;
        this.extra1 = extra1;
        this.extra2 = extra2;
    }
}
