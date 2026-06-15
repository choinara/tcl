package com.peakmate.backend.domain.aas.entity;

import com.peakmate.core.audit.AuditableEntity;
import jakarta.persistence.*;
import lombok.AccessLevel;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import org.hibernate.annotations.ColumnDefault;

import java.time.LocalDateTime;

/**
 * 데이터소스 엔티티 (PLC, Vision, Database)
 */
@Getter
@Entity
@Table(name = "data_source")
@NoArgsConstructor(access = AccessLevel.PROTECTED)
public class DataSource extends AuditableEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "seq_id", nullable = false)
    private Long id;

    @Column(name = "source_id", nullable = false, length = 50, unique = true)
    private String sourceId;

    @Column(name = "source_name", nullable = false, length = 255)
    private String sourceName;

    @Column(name = "source_type", nullable = false, length = 30)
    private String sourceType;

    @Column(name = "plc_protocol", length = 50)
    private String plcProtocol;

    @Column(name = "plc_ip", length = 255)
    private String plcIp;

    @Column(name = "plc_port")
    private Integer plcPort;

    @Column(name = "vision_watch_folder", length = 500)
    private String visionWatchFolder;

    @Column(name = "vision_csv_pattern", length = 255)
    private String visionCsvPattern;

    @Column(name = "unit_id")
    private Integer unitId;

    @Column(name = "address_base")
    private Integer addressBase;

    @Column(name = "byte_order", length = 20)
    private String byteOrder;

    @Column(name = "word_order", length = 20)
    private String wordOrder;

    @Column(name = "asset_instance_id")
    private Long assetInstanceId;

    @Column(name = "asset_instance_code", length = 50)
    private String assetInstanceCode;

    @Column(name = "asset_instance_name", length = 255)
    private String assetInstanceName;

    @Column(name = "status", length = 20)
    private String status;

    @Column(name = "last_connected_at")
    private LocalDateTime lastConnectedAt;

    @ColumnDefault("'Y'")
    @Column(name = "use_yn", nullable = false, length = 1, columnDefinition = "CHAR(1)")
    private String useYn;

    @Builder
    private DataSource(String sourceId, String sourceName, String sourceType,
                       String plcProtocol, String plcIp, Integer plcPort,
                       String visionWatchFolder, String visionCsvPattern,
                       Integer unitId, Integer addressBase, String byteOrder, String wordOrder,
                       Long assetInstanceId, String assetInstanceCode, String assetInstanceName,
                       String status, LocalDateTime lastConnectedAt,
                       String useYn) {
        this.sourceId = sourceId;
        this.sourceName = sourceName;
        this.sourceType = sourceType;
        this.plcProtocol = plcProtocol;
        this.plcIp = plcIp;
        this.plcPort = plcPort;
        this.visionWatchFolder = visionWatchFolder;
        this.visionCsvPattern = visionCsvPattern;
        this.unitId = unitId;
        this.addressBase = addressBase;
        this.byteOrder = byteOrder;
        this.wordOrder = wordOrder;
        this.assetInstanceId = assetInstanceId;
        this.assetInstanceCode = assetInstanceCode;
        this.assetInstanceName = assetInstanceName;
        this.status = status;
        this.lastConnectedAt = lastConnectedAt;
        this.useYn = useYn;
    }

    public static DataSource create(String sourceId, String sourceName, String sourceType,
                                     String plcProtocol, String plcIp, Integer plcPort,
                                     String visionWatchFolder, String visionCsvPattern,
                                     String status, String assetInstanceCode, String assetInstanceName,
                                     Integer unitId, Integer addressBase, String byteOrder, String wordOrder,
                                     String useYn, Long assetInstanceId) {
        return DataSource.builder()
                .sourceId(sourceId).sourceName(sourceName).sourceType(sourceType)
                .plcProtocol(plcProtocol).plcIp(plcIp).plcPort(plcPort)
                .visionWatchFolder(visionWatchFolder).visionCsvPattern(visionCsvPattern)
                .unitId(unitId).addressBase(addressBase)
                .byteOrder(byteOrder).wordOrder(wordOrder)
                .assetInstanceId(assetInstanceId)
                .assetInstanceCode(assetInstanceCode).assetInstanceName(assetInstanceName)
                .status(status != null ? status : "ACTIVE")
                .useYn(useYn != null ? useYn : "Y")
                .build();
    }

    public void update(String sourceName, String sourceType, String plcProtocol, String plcIp,
                       Integer plcPort, String visionWatchFolder, String visionCsvPattern,
                       String status, String assetInstanceCode, String assetInstanceName,
                       Integer unitId, Integer addressBase, String byteOrder, String wordOrder,
                       String useYn, Long assetInstanceId) {
        this.sourceName = sourceName;
        this.sourceType = sourceType;
        this.plcProtocol = plcProtocol;
        this.plcIp = plcIp;
        this.plcPort = plcPort;
        this.visionWatchFolder = visionWatchFolder;
        this.visionCsvPattern = visionCsvPattern;
        this.status = status != null ? status : this.status;
        this.assetInstanceId = assetInstanceId;
        this.assetInstanceCode = assetInstanceCode;
        this.assetInstanceName = assetInstanceName;
        this.unitId = unitId;
        this.addressBase = addressBase;
        this.byteOrder = byteOrder;
        this.wordOrder = wordOrder;
        this.useYn = useYn != null ? useYn : this.useYn;
    }
}
