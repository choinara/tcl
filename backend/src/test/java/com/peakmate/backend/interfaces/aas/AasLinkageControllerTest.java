package com.peakmate.backend.interfaces.aas;

import com.peakmate.backend.domain.aas.entity.AasLinkage;
import com.peakmate.backend.domain.aas.entity.OpcuaDataPoint;
import com.peakmate.backend.domain.aas.service.AasLinkageDomainService;
import com.peakmate.backend.domain.aas.service.OpcuaDataPointDomainService;
import com.peakmate.backend.interfaces.aas.controller.AasLinkageController;
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
import com.peakmate.backend.domain.log.service.SystemLogService;import org.springframework.test.web.servlet.MockMvc;

import java.util.List;
import java.util.Map;
import java.util.Optional;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.BDDMockito.given;
import static org.mockito.Mockito.verify;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultHandlers.print;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

/**
 * AasLinkageController 단위 테스트.
 * AAS 연계 상태 조회, 연결/해제 API를 검증합니다.
 */
@WebMvcTest(
    controllers = AasLinkageController.class,
    excludeAutoConfiguration = SecurityAutoConfiguration.class,
    excludeFilters = @ComponentScan.Filter(
        type = FilterType.REGEX,
        pattern = "com\\.peakmate\\.backend\\.infra\\.security\\..*"
    )
)
@ActiveProfiles("test")
class AasLinkageControllerTest {

    @Autowired
    private MockMvc mockMvc;
    @MockitoBean SystemLogService systemLogService;

    @MockitoBean
    private AasLinkageDomainService linkageService;

    @MockitoBean
    private OpcuaDataPointDomainService dataPointService;

    @Test
    @DisplayName("GET /api/aas/linkage - 전체 연계 상태 조회")
    void getLinkageStatus_returnsDataAndStats() throws Exception {
        OpcuaDataPoint dp = OpcuaDataPoint.create(
                "ns=2;s=Temp/Heat", "Heat", "히터",
                null, "Temperature", "Word", "°C", 1000,
                "plc_direct", "D100", null, null, true,
                null, null, null, null, null, null, null, null);
        given(dataPointService.getAllDataPoints()).willReturn(List.of(dp));
        given(linkageService.getAllLinkages()).willReturn(List.of());
        given(linkageService.getStatsByCategory()).willReturn(Map.of("Temperature", Map.of("total", 1L, "linked", 0L)));
        given(linkageService.countLinked()).willReturn(0L);

        mockMvc.perform(get("/api/aas/linkage"))
                .andDo(print())
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data_points").isArray())
                .andExpect(jsonPath("$.data_points[0].node_id").value("ns=2;s=Temp/Heat"))
                .andExpect(jsonPath("$.total_linked").value(0))
                .andExpect(jsonPath("$.total_points").value(1));
    }

    @Test
    @DisplayName("GET /api/aas/linkage/stats - 카테고리별 연결 통계")
    void getStats_returnsCategoryStats() throws Exception {
        given(linkageService.getStatsByCategory()).willReturn(
                Map.of("Temperature", Map.of("total", 10L, "linked", 5L)));
        given(linkageService.countLinked()).willReturn(5L);

        mockMvc.perform(get("/api/aas/linkage/stats"))
                .andDo(print())
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.total_linked").value(5))
                .andExpect(jsonPath("$.categories.Temperature.total").value(10));
    }

    @Test
    @DisplayName("PUT /api/aas/linkage/{nodeId}/link - AAS 연결 성공")
    void link_success() throws Exception {
        String nodeId = "node-temp-001";
        OpcuaDataPoint dp = OpcuaDataPoint.create(
                nodeId, "Heat", null,
                null, "Temperature", "Word", "°C", 1000,
                "plc_direct", "D100", null, null, true,
                null, null, null, null, null, null, null, null);
        given(dataPointService.findByNodeId(nodeId)).willReturn(Optional.of(dp));

        AasLinkage linkage = AasLinkage.create(nodeId, 1L, "/OperationalData/Temperature:Heat");
        given(linkageService.link(eq(nodeId), eq(1L), any())).willReturn(linkage);

        mockMvc.perform(put("/api/aas/linkage/" + nodeId + "/link")
                .contentType(MediaType.APPLICATION_JSON)
                .content("""
                    {
                        "element_id": 1,
                        "aas_path": "/OperationalData/Temperature:Heat"
                    }
                    """))
                .andDo(print())
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.node_id").value(nodeId));
    }

    @Test
    @DisplayName("PUT /api/aas/linkage/{nodeId}/unlink - 존재하지 않는 노드 해제 시 404")
    void unlink_notFound() throws Exception {
        given(dataPointService.findByNodeId("NONE")).willReturn(Optional.empty());

        mockMvc.perform(put("/api/aas/linkage/NONE/unlink"))
                .andDo(print())
                .andExpect(status().isNotFound());
    }
}
