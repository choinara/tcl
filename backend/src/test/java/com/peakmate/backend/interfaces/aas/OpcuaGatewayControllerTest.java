package com.peakmate.backend.interfaces.aas;

import com.peakmate.backend.domain.aas.entity.OpcuaDataPoint;
import com.peakmate.backend.domain.aas.entity.OpcuaEdgeLastHeartbeat;
import com.peakmate.backend.domain.aas.entity.OpcuaGatewayLog;
import com.peakmate.backend.domain.aas.service.OpcuaDataPointDomainService;
import com.peakmate.backend.domain.aas.service.OpcuaGatewayDomainService;
import com.peakmate.backend.interfaces.aas.controller.OpcuaGatewayController;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.autoconfigure.security.servlet.SecurityAutoConfiguration;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.context.annotation.ComponentScan;
import org.springframework.context.annotation.FilterType;
import org.springframework.http.MediaType;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import com.peakmate.backend.domain.log.service.SystemLogService;
import org.springframework.test.web.servlet.MockMvc;

import java.util.List;

import static org.mockito.ArgumentMatchers.*;
import static org.mockito.BDDMockito.given;
import static org.mockito.Mockito.verify;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultHandlers.print;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

/**
 * OpcuaGatewayController 단위 테스트.
 * 게이트웨이 서버 상태, 하트비트, 세션, 설비 노드, 로그 API를 검증합니다.
 */
@WebMvcTest(
    controllers = OpcuaGatewayController.class,
    excludeAutoConfiguration = SecurityAutoConfiguration.class,
    excludeFilters = @ComponentScan.Filter(
        type = FilterType.REGEX,
        pattern = "com\\.peakmate\\.backend\\.infra\\.security\\..*"
    )
)
@ActiveProfiles("test")
class OpcuaGatewayControllerTest {

    @Autowired
    private MockMvc mockMvc;
    @MockitoBean SystemLogService systemLogService;

    @MockitoBean
    private OpcuaGatewayDomainService gatewayService;

    @MockitoBean
    private OpcuaDataPointDomainService dataPointService;

    @Test
    @DisplayName("GET /api/opcua/gateway/status - 서버 상태 조회 (dead_batch_count, edges 포함)")
    void getStatus_returnsServerInfo() throws Exception {
        given(dataPointService.countActive()).willReturn(10L);
        given(dataPointService.countLinked()).willReturn(3L);
        given(gatewayService.countDeadBatches()).willReturn(2L);
        given(gatewayService.getEdgeStatuses()).willReturn(List.of());

        mockMvc.perform(get("/api/opcua/gateway/status"))
                .andDo(print())
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.status").value("RUNNING"))
                .andExpect(jsonPath("$.endpoint").exists())
                .andExpect(jsonPath("$.total_monitored_items").value(10))
                .andExpect(jsonPath("$.memory_mb").isNumber())
                .andExpect(jsonPath("$.dead_batch_count").value(2))
                .andExpect(jsonPath("$.edges").isArray());
    }

    @Test
    @DisplayName("POST /api/opcua/gateway/heartbeat - 하트비트 수신")
    void receiveHeartbeat_success() throws Exception {
        OpcuaEdgeLastHeartbeat heartbeat = OpcuaEdgeLastHeartbeat.create(
                "edge-01", "RUNNING", 1200, "CONNECTED", 3600L);
        given(gatewayService.receiveHeartbeat(
                eq("edge-01"), eq("RUNNING"), eq(1200), eq("CONNECTED"), eq(3600L)))
                .willReturn(heartbeat);

        mockMvc.perform(post("/api/opcua/gateway/heartbeat")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {
                                  "edge_id": "edge-01",
                                  "status": "RUNNING",
                                  "ingest_count_1m": 1200,
                                  "bridge_status": "CONNECTED",
                                  "uptime_sec": 3600
                                }
                                """))
                .andDo(print())
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.message").value("ok"));

        verify(gatewayService).receiveHeartbeat("edge-01", "RUNNING", 1200, "CONNECTED", 3600L);
    }

    @Test
    @DisplayName("GET /api/opcua/gateway/sessions - 빈 세션 목록 반환")
    void getSessions_returnsEmptyList() throws Exception {
        mockMvc.perform(get("/api/opcua/gateway/sessions"))
                .andDo(print())
                .andExpect(status().isOk())
                .andExpect(jsonPath("$").isArray())
                .andExpect(jsonPath("$").isEmpty());
    }

    @Test
    @DisplayName("GET /api/opcua/gateway/equip-nodes - 설비별 노드 현황 조회")
    void getEquipNodes_returnsGroupedByCategory() throws Exception {
        OpcuaDataPoint dp = OpcuaDataPoint.create(
                "ns=2;s=Temp/Heat", "Heat", null,
                null, "Temperature", "Word", "°C", 1000,
                "plc_direct", "D100", null, null, true,
                null, null, null, null, null, null, null, null);
        given(dataPointService.getAllDataPoints()).willReturn(List.of(dp));

        mockMvc.perform(get("/api/opcua/gateway/equip-nodes"))
                .andDo(print())
                .andExpect(status().isOk())
                .andExpect(jsonPath("$").isArray())
                .andExpect(jsonPath("$[0].instance_id").value("Temperature"))
                .andExpect(jsonPath("$[0].node_count").value(1));
    }

    @Test
    @DisplayName("GET /api/opcua/gateway/logs - 게이트웨이 로그 조회")
    void getLogs_returnsList() throws Exception {
        OpcuaGatewayLog log = OpcuaGatewayLog.create("INFO", "OpcuaServer", "서버 시작됨");
        given(gatewayService.getRecentLogs()).willReturn(List.of(log));

        mockMvc.perform(get("/api/opcua/gateway/logs"))
                .andDo(print())
                .andExpect(status().isOk())
                .andExpect(jsonPath("$").isArray())
                .andExpect(jsonPath("$[0].level").value("INFO"))
                .andExpect(jsonPath("$[0].source").value("OpcuaServer"))
                .andExpect(jsonPath("$[0].message").value("서버 시작됨"));
    }

    @Test
    @DisplayName("DELETE /api/opcua/gateway/logs - 로그 전체 삭제")
    void clearLogs_success() throws Exception {
        mockMvc.perform(delete("/api/opcua/gateway/logs"))
                .andDo(print())
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.message").exists());

        verify(gatewayService).clearLogs();
    }
}
