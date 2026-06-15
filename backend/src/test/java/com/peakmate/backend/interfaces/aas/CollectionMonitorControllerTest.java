package com.peakmate.backend.interfaces.aas;

import com.peakmate.backend.domain.aas.entity.CollectedData;
import com.peakmate.backend.domain.aas.entity.CollectionChannel;
import com.peakmate.backend.domain.aas.entity.OpcuaDataPoint;
import com.peakmate.backend.domain.aas.service.CollectionMonitorDomainService;
import com.peakmate.backend.domain.aas.service.OpcuaDataPointDomainService;
import com.peakmate.backend.interfaces.aas.controller.CollectionMonitorController;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.autoconfigure.security.servlet.SecurityAutoConfiguration;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.context.annotation.ComponentScan;
import org.springframework.context.annotation.FilterType;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import com.peakmate.backend.domain.log.service.SystemLogService;import org.springframework.test.web.servlet.MockMvc;

import java.util.List;

import static org.mockito.BDDMockito.given;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultHandlers.print;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

/**
 * CollectionMonitorController 단위 테스트.
 * 수집 채널, 수집 상태, 수집 데이터 API를 검증합니다.
 */
@WebMvcTest(
    controllers = CollectionMonitorController.class,
    excludeAutoConfiguration = SecurityAutoConfiguration.class,
    excludeFilters = @ComponentScan.Filter(
        type = FilterType.REGEX,
        pattern = "com\\.peakmate\\.backend\\.infra\\.security\\..*"
    )
)
@ActiveProfiles("test")
class CollectionMonitorControllerTest {

    @Autowired
    private MockMvc mockMvc;
    @MockitoBean SystemLogService systemLogService;

    @MockitoBean
    private CollectionMonitorDomainService monitorService;

    @MockitoBean
    private OpcuaDataPointDomainService dataPointService;

    @Test
    @DisplayName("GET /api/opcua/channels - 채널 목록 조회")
    void getChannels_returnsList() throws Exception {
        CollectionChannel ch = CollectionChannel.create("plc_1s", "PLC 1초 수집");
        given(monitorService.getAllChannels()).willReturn(List.of(ch));

        mockMvc.perform(get("/api/opcua/channels"))
                .andDo(print())
                .andExpect(status().isOk())
                .andExpect(jsonPath("$").isArray())
                .andExpect(jsonPath("$[0].channel_id").value("plc_1s"))
                .andExpect(jsonPath("$[0].name").value("PLC 1초 수집"))
                .andExpect(jsonPath("$[0].active").value(false));
    }

    @Test
    @DisplayName("PUT /api/opcua/channels/{id}/toggle - 채널 토글 성공")
    void toggleChannel_success() throws Exception {
        CollectionChannel toggled = CollectionChannel.create("plc_1s", "PLC 1초 수집");
        toggled.toggleActive(); // N → Y
        given(monitorService.toggleChannel("plc_1s")).willReturn(toggled);

        mockMvc.perform(put("/api/opcua/channels/plc_1s/toggle"))
                .andDo(print())
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.channel_id").value("plc_1s"))
                .andExpect(jsonPath("$.active").value(true));
    }

    @Test
    @DisplayName("PUT /api/opcua/channels/{id}/toggle - 존재하지 않는 채널 토글 시 404")
    void toggleChannel_notFound() throws Exception {
        given(monitorService.toggleChannel("NONE"))
                .willThrow(new IllegalArgumentException("채널을 찾을 수 없습니다: NONE"));

        mockMvc.perform(put("/api/opcua/channels/NONE/toggle"))
                .andDo(print())
                .andExpect(status().isNotFound());
    }

    @Test
    @DisplayName("GET /api/opcua/collection-status - 수집 상태 조회")
    void getCollectionStatus_returnsGroupedByCategory() throws Exception {
        OpcuaDataPoint dp = OpcuaDataPoint.create(
                "ns=2;s=Temp/Heat", "Heat", null,
                null, "Temperature", "Word", "°C", 1000,
                "plc_direct", "D100", null, null, true,
                null, null, null, null, null, null, null, null);
        given(dataPointService.getAllDataPoints()).willReturn(List.of(dp));

        mockMvc.perform(get("/api/opcua/collection-status"))
                .andDo(print())
                .andExpect(status().isOk())
                .andExpect(jsonPath("$").isArray())
                .andExpect(jsonPath("$[0].instance_id").value("Temperature"))
                .andExpect(jsonPath("$[0].connected").value(true));
    }

    @Test
    @DisplayName("GET /api/opcua/collected-data - 수집 데이터 빈 목록 반환")
    void getCollectedData_returnsEmptyList() throws Exception {
        given(monitorService.getRecentData()).willReturn(List.of());
        given(dataPointService.getAllDataPoints()).willReturn(List.of());

        mockMvc.perform(get("/api/opcua/collected-data"))
                .andDo(print())
                .andExpect(status().isOk())
                .andExpect(jsonPath("$").isArray())
                .andExpect(jsonPath("$").isEmpty());
    }

    @Test
    @DisplayName("GET /api/opcua/collected-data - 수집 데이터 조회 시 노드 정보 보강")
    void getCollectedData_enrichesWithNodeInfo() throws Exception {
        CollectedData data = CollectedData.create("ns=2;s=Temp/Heat", "plc_1s", "25.5");
        OpcuaDataPoint dp = OpcuaDataPoint.create(
                "ns=2;s=Temp/Heat", "Heat", null,
                null, "Temperature", "Word", "°C", 1000,
                "plc_direct", "D100", null, null, true,
                null, null, null, null, null, null, null, null);
        given(monitorService.getRecentData()).willReturn(List.of(data));
        given(dataPointService.getAllDataPoints()).willReturn(List.of(dp));

        mockMvc.perform(get("/api/opcua/collected-data"))
                .andDo(print())
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[0].node_id").value("ns=2;s=Temp/Heat"))
                .andExpect(jsonPath("$[0].value").value("25.5"))
                .andExpect(jsonPath("$[0].category").value("Temperature"))
                .andExpect(jsonPath("$[0].unit").value("°C"))
                .andExpect(jsonPath("$[0].plc_address").value("D100"));
    }
}
