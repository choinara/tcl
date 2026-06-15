package com.peakmate.backend.infra.repository.aas;

import com.peakmate.backend.domain.aas.entity.OpcuaGatewayLog;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface OpcuaGatewayLogJpaRepository extends JpaRepository<OpcuaGatewayLog, Long> {
    List<OpcuaGatewayLog> findTop100ByOrderByCreatedAtDesc();
    void deleteAll();
}
