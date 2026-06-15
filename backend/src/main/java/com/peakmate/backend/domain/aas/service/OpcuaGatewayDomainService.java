package com.peakmate.backend.domain.aas.service;

import com.peakmate.backend.domain.aas.entity.OpcuaEdgeLastHeartbeat;
import com.peakmate.backend.domain.aas.entity.OpcuaGatewayLog;
import com.peakmate.backend.infra.repository.aas.OpcuaBatchPendingJpaRepository;
import com.peakmate.backend.infra.repository.aas.OpcuaEdgeLastHeartbeatRepository;
import com.peakmate.backend.infra.repository.aas.OpcuaGatewayLogJpaRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

/**
 * OPC-UA 게이트웨이 도메인 서비스
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class OpcuaGatewayDomainService {

    private final OpcuaGatewayLogJpaRepository logRepository;
    private final OpcuaEdgeLastHeartbeatRepository heartbeatRepository;
    private final OpcuaBatchPendingJpaRepository pendingRepository;

    @Transactional(readOnly = true)
    public List<OpcuaGatewayLog> getRecentLogs() {
        return logRepository.findTop100ByOrderByCreatedAtDesc();
    }

    @Transactional
    public OpcuaGatewayLog writeLog(String level, String source, String message) {
        OpcuaGatewayLog logEntry = OpcuaGatewayLog.create(level, source, message);
        return logRepository.save(logEntry);
    }

    @Transactional
    public void clearLogs() {
        logRepository.deleteAll();
        log.debug("[게이트웨이 로그] 전체 삭제");
    }

    @Transactional
    public OpcuaEdgeLastHeartbeat receiveHeartbeat(
            String edgeId, String status, int ingestCount1m,
            String bridgeStatus, long uptimeSec) {
        return heartbeatRepository.findByEdgeId(edgeId)
                .map(existing -> {
                    existing.update(status, ingestCount1m, bridgeStatus, uptimeSec);
                    return existing;
                })
                .orElseGet(() -> heartbeatRepository.save(
                        OpcuaEdgeLastHeartbeat.create(edgeId, status, ingestCount1m, bridgeStatus, uptimeSec)));
    }

    @Transactional(readOnly = true)
    public List<OpcuaEdgeLastHeartbeat> getEdgeStatuses() {
        return heartbeatRepository.findAllByOrderByHeartbeatAtDesc();
    }

    @Transactional(readOnly = true)
    public long countDeadBatches() {
        return pendingRepository.countDead();
    }
}
