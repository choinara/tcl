package com.peakmate.backend.infra.aas;

/**
 * OPC-UA 수집 데이터 포인트 레코드.
 * 내부 큐(OpcuaDataQueue)와 TimescaleDB batch INSERT에서 공통 사용.
 */
public record OpcuaPointRecord(
        String edgeId,
        String nodeId,
        String value,
        String dataType,
        String quality,
        String collectedAt
) {}
