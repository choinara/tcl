package com.peakmate.backend.infra.repository.aas;

import com.peakmate.backend.domain.aas.entity.OpcuaEdgeLastHeartbeat;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface OpcuaEdgeLastHeartbeatRepository extends JpaRepository<OpcuaEdgeLastHeartbeat, Long> {
    Optional<OpcuaEdgeLastHeartbeat> findByEdgeId(String edgeId);
    List<OpcuaEdgeLastHeartbeat> findAllByOrderByHeartbeatAtDesc();
}
