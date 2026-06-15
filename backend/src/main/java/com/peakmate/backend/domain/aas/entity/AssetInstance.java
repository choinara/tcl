package com.peakmate.backend.domain.aas.entity;

import com.peakmate.core.audit.AuditableEntity;
import jakarta.persistence.*;
import lombok.AccessLevel;
import lombok.Getter;
import lombok.NoArgsConstructor;
import org.hibernate.annotations.ColumnDefault;
import org.hibernate.annotations.JdbcTypeCode;
import org.hibernate.type.SqlTypes;

import java.util.ArrayList;
import java.util.List;

@Getter
@Entity
@Table(name = "asset_instance")
@NoArgsConstructor(access = AccessLevel.PROTECTED)
public class AssetInstance extends AuditableEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "seq_id", nullable = false)
    private Long id;

    @Column(name = "instance_id", nullable = false, length = 50, unique = true)
    private String instanceId;

    @Column(name = "instance_name", nullable = false, length = 255)
    private String instanceName;

    @Column(name = "type_code", length = 50)
    private String typeCode;

    @Column(name = "location_floor", length = 20)
    private String locationFloor;

    @Column(name = "serial_number", length = 100)
    private String serialNumber;

    @Column(name = "status", length = 20)
    private String status;

    @ColumnDefault("'Y'")
    @Column(name = "use_yn", nullable = false, length = 1, columnDefinition = "CHAR(1)")
    private String useYn;

    @Column(name = "linked_menu_code", length = 50)
    private String linkedMenuCode;

    @Column(name = "linked_record_id")
    private Long linkedRecordId;

    @Column(name = "link_status", length = 20, nullable = false)
    private String linkStatus = "STANDALONE";

    @Column(name = "linked_columns", columnDefinition = "jsonb")
    @JdbcTypeCode(SqlTypes.JSON)
    private List<LinkedColumnEntry> linkedColumns = new ArrayList<>();

    public record LinkedColumnEntry(int seq, String key, String label, String value) {}

    // Q6 A안: 신규 생성 시 link 정보 포함 (nullable). hasLink=false 시 400은 Controller에서 강제
    public static AssetInstance create(String instanceId, String instanceName, String typeCode,
                                       String linkedMenuCode, Long linkedRecordId,
                                       List<LinkedColumnEntry> linkedColumns) {
        AssetInstance ai = new AssetInstance();
        ai.instanceId   = instanceId;
        ai.instanceName = instanceName;
        ai.typeCode     = typeCode;
        ai.status       = "ACTIVE";
        ai.useYn        = "Y";
        if (linkedMenuCode != null && linkedRecordId != null
                && linkedColumns != null && !linkedColumns.isEmpty()) {
            ai.linkedMenuCode = linkedMenuCode;
            ai.linkedRecordId = linkedRecordId;
            ai.linkedColumns  = linkedColumns;
            ai.linkStatus     = "LINKED";
        } else {
            ai.linkStatus    = "STANDALONE";
            ai.linkedColumns = new ArrayList<>();
        }
        return ai;
    }

    public void update(String instanceName, String typeCode, String locationFloor, String serialNumber) {
        this.instanceName  = instanceName;
        this.typeCode      = typeCode;
        this.locationFloor = locationFloor;
        this.serialNumber  = serialNumber;
    }

    // 기존 행 재연결 전용 (/link 엔드포인트)
    public void link(String menuCode, Long recordId, List<LinkedColumnEntry> columns) {
        this.linkedMenuCode = menuCode;
        this.linkedRecordId = recordId;
        this.linkedColumns  = columns;
        this.linkStatus     = "LINKED";
    }

    public void unlink() {
        this.linkedMenuCode = null;
        this.linkedRecordId = null;
        this.linkedColumns  = new ArrayList<>();
        this.linkStatus     = "STANDALONE";
    }
}
