package com.peakmate.backend.domain.aas.entity;

import com.peakmate.core.audit.AuditableEntity;
import jakarta.persistence.*;
import lombok.AccessLevel;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import org.hibernate.annotations.ColumnDefault;

import java.math.BigDecimal;
import java.time.LocalDateTime;

/**
 * OPC-UA 데이터 포인트 엔티티
 * (매핑 + 수집 항목 + OPC-UA 노드 통합)
 */
@Getter
@Entity
@Table(name = "opcua_data_point")
@NoArgsConstructor(access = AccessLevel.PROTECTED)
public class OpcuaDataPoint extends AuditableEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "seq_id", nullable = false)
    private Long id;

    @Column(name = "node_id", nullable = false, length = 100, unique = true)
    private String nodeId;

    @Column(name = "browse_name", nullable = false, length = 255)
    private String browseName;

    @Column(name = "display_name", length = 255)
    private String displayName;

    @Column(name = "korean_name", length = 255)
    private String koreanName;

    @Column(name = "category", length = 50)
    private String category;

    @Column(name = "node_class", length = 50)
    private String nodeClass;

    @Column(name = "data_type", length = 50)
    private String dataType;

    @Column(name = "unit", length = 50)
    private String unit;

    @Column(name = "source_id", length = 50)
    private String sourceId;

    @Column(name = "plc_address", length = 100)
    private String plcAddress;

    @Column(name = "sampling_ms")
    private Integer samplingMs;

    @Column(name = "channel", length = 30)
    private String channel;

    @Column(name = "scale_factor", precision = 10, scale = 4)
    private BigDecimal scaleFactor;

    @Column(name = "offset_value", precision = 10, scale = 4)
    private BigDecimal offsetValue;

    @ColumnDefault("'Y'")
    @Column(name = "polling_enabled", length = 1, columnDefinition = "CHAR(1)")
    private String pollingEnabled;

    @ColumnDefault("'N'")
    @Column(name = "is_published", length = 1, columnDefinition = "CHAR(1)")
    private String isPublished;

    @Column(name = "last_value", length = 255)
    private String lastValue;

    @Column(name = "last_updated")
    private LocalDateTime lastUpdated;

    @Column(name = "aas_path", length = 500)
    private String aasPath;

    @ColumnDefault("'N'")
    @Column(name = "aas_linked", length = 1, columnDefinition = "CHAR(1)")
    private String aasLinked;

    @Column(name = "source_type", length = 30)
    private String sourceType;

    @Column(name = "aas_property_path", length = 500)
    private String aasPropertyPath;

    @Column(name = "vision_csv_column", length = 255)
    private String visionCsvColumn;

    @ColumnDefault("'Y'")
    @Column(name = "is_active", length = 1, columnDefinition = "CHAR(1)")
    private String isActive;

    @Column(name = "parent_node_id", length = 100)
    private String parentNodeId;

    @ColumnDefault("'Y'")
    @Column(name = "use_yn", nullable = false, length = 1, columnDefinition = "CHAR(1)")
    private String useYn;

    @Column(name = "asset_instance_id")
    private Long assetInstanceId;

    @Column(name = "edge_name", length = 50)
    private String edgeName;

    @Column(name = "equip_name", length = 100)
    private String equipName;

    @Column(name = "array_index")
    private Integer arrayIndex;

    @Column(name = "memory_area", length = 30)
    private String memoryArea;

    @Column(name = "register_count")
    private Integer registerCount;

    @Column(name = "bit_position")
    private Integer bitPosition;

    @Builder
    private OpcuaDataPoint(String nodeId, String browseName, String displayName, String koreanName,
                           String category, String nodeClass, String dataType, String unit,
                           String sourceId, String plcAddress, Integer samplingMs, String channel,
                           BigDecimal scaleFactor, BigDecimal offsetValue,
                           String pollingEnabled, String isPublished,
                           String aasPath, String aasLinked, String sourceType,
                           String aasPropertyPath, String visionCsvColumn, String isActive,
                           String parentNodeId, String useYn,
                           Long assetInstanceId, String edgeName, String equipName, Integer arrayIndex,
                           String memoryArea, Integer registerCount, Integer bitPosition) {
        this.nodeId = nodeId;
        this.browseName = browseName;
        this.displayName = displayName;
        this.koreanName = koreanName;
        this.category = category;
        this.nodeClass = nodeClass;
        this.dataType = dataType;
        this.unit = unit;
        this.sourceId = sourceId;
        this.plcAddress = plcAddress;
        this.samplingMs = samplingMs;
        this.channel = channel;
        this.scaleFactor = scaleFactor;
        this.offsetValue = offsetValue;
        this.pollingEnabled = pollingEnabled;
        this.isPublished = isPublished;
        this.aasPath = aasPath;
        this.aasLinked = aasLinked;
        this.sourceType = sourceType;
        this.aasPropertyPath = aasPropertyPath;
        this.visionCsvColumn = visionCsvColumn;
        this.isActive = isActive;
        this.parentNodeId = parentNodeId;
        this.useYn = useYn;
        this.assetInstanceId = assetInstanceId;
        this.edgeName = edgeName;
        this.equipName = equipName;
        this.arrayIndex = arrayIndex;
        this.memoryArea = memoryArea;
        this.registerCount = registerCount;
        this.bitPosition = bitPosition;
    }

    public static OpcuaDataPoint create(String nodeId, String browseName, String displayName,
                                         String koreanName, String category, String dataType,
                                         String unit, Integer samplingMs, String sourceType,
                                         String plcAddress, String aasPropertyPath, String visionCsvColumn,
                                         boolean isActive,
                                         Long assetInstanceId, String edgeName, String equipName,
                                         Integer arrayIndex,
                                         String memoryArea, Integer registerCount, Integer bitPosition,
                                         String sourceId) {
        return OpcuaDataPoint.builder()
                .nodeId(nodeId).browseName(browseName).displayName(displayName)
                .koreanName(koreanName).category(category).nodeClass("Variable")
                .dataType(dataType).unit(unit).samplingMs(samplingMs != null ? samplingMs : 1000)
                .scaleFactor(BigDecimal.ONE).offsetValue(BigDecimal.ZERO)
                .pollingEnabled("Y").isPublished("N")
                .aasLinked("N").sourceType(sourceType)
                .sourceId(sourceId)
                .plcAddress(plcAddress).aasPropertyPath(aasPropertyPath)
                .visionCsvColumn(visionCsvColumn)
                .isActive(isActive ? "Y" : "N")
                .useYn("Y")
                .assetInstanceId(assetInstanceId)
                .edgeName(edgeName)
                .equipName(equipName)
                .arrayIndex(arrayIndex != null ? arrayIndex : -1)
                .memoryArea(memoryArea)
                .registerCount(registerCount)
                .bitPosition(bitPosition)
                .build();
    }

    public void update(String browseName, String displayName, String koreanName,
                       String category, String dataType, String unit, Integer samplingMs,
                       String sourceType, String plcAddress, String aasPropertyPath,
                       String visionCsvColumn, boolean isActive,
                       String memoryArea, Integer registerCount, Integer bitPosition,
                       String sourceId) {
        this.browseName = browseName;
        this.displayName = displayName;
        this.koreanName = koreanName;
        this.category = category;
        this.dataType = dataType;
        this.unit = unit;
        this.samplingMs = samplingMs;
        this.sourceType = sourceType;
        this.plcAddress = plcAddress;
        this.aasPropertyPath = aasPropertyPath;
        this.visionCsvColumn = visionCsvColumn;
        this.isActive = isActive ? "Y" : "N";
        this.memoryArea = memoryArea;
        this.registerCount = registerCount;
        this.bitPosition = bitPosition;
        this.sourceId = sourceId;
    }

    public void updateFromCsv(String aasPropertyPath, String edgeName, String equipName,
                              Integer samplingMs, Integer arrayIndex, Long assetInstanceId) {
        this.aasPropertyPath = aasPropertyPath;
        this.edgeName = edgeName;
        this.equipName = equipName;
        this.samplingMs = samplingMs;
        this.arrayIndex = arrayIndex;
        this.assetInstanceId = assetInstanceId;
    }

    public void publishAsNode() {
        this.isPublished = "Y";
    }

    public void linkToAas(String aasPath) {
        this.aasLinked = "Y";
        this.aasPath = aasPath;
    }

    public void unlinkFromAas() {
        this.aasLinked = "N";
        this.aasPath = null;
    }
}
