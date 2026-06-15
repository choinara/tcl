package com.peakmate.backend.domain.aas.entity;

import com.peakmate.core.audit.AuditableEntity;
import jakarta.persistence.*;
import lombok.AccessLevel;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;

/**
 * OPC-UA 게이트웨이 로그 엔티티
 */
@Getter
@Entity
@Table(name = "opcua_gateway_log")
@NoArgsConstructor(access = AccessLevel.PROTECTED)
public class OpcuaGatewayLog extends AuditableEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "seq_id", nullable = false)
    private Long id;

    @Column(name = "log_level", nullable = false, length = 10)
    private String logLevel;

    @Column(name = "source", length = 100)
    private String source;

    @Column(name = "message", columnDefinition = "TEXT")
    private String message;

    @Builder
    private OpcuaGatewayLog(String logLevel, String source, String message) {
        this.logLevel = logLevel;
        this.source = source;
        this.message = message;
    }

    public static OpcuaGatewayLog create(String logLevel, String source, String message) {
        return OpcuaGatewayLog.builder()
                .logLevel(logLevel)
                .source(source)
                .message(message)
                .build();
    }
}
