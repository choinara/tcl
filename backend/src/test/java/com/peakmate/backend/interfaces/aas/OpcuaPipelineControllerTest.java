package com.peakmate.backend.interfaces.aas;

import com.peakmate.backend.application.aas.OpcuaPipelineAppService;
import com.peakmate.backend.domain.log.service.SystemLogService;
import com.peakmate.backend.interfaces.aas.controller.OpcuaPipelineController;
import com.peakmate.core.error.EntityNotFoundException;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.autoconfigure.security.servlet.SecurityAutoConfiguration;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.context.annotation.ComponentScan;
import org.springframework.context.annotation.FilterType;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.PageRequest;
import org.springframework.http.MediaType;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import org.springframework.test.web.servlet.MockMvc;

import java.util.List;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyList;
import static org.mockito.BDDMockito.given;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@WebMvcTest(
    controllers = OpcuaPipelineController.class,
    excludeAutoConfiguration = SecurityAutoConfiguration.class,
    excludeFilters = @ComponentScan.Filter(
        type = FilterType.REGEX,
        pattern = "com\\.peakmate\\.backend\\.infra\\.security\\..*"
    )
)
@ActiveProfiles("test")
class OpcuaPipelineControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @MockitoBean
    private OpcuaPipelineAppService pipelineAppService;

    @MockitoBean
    private SystemLogService systemLogService;

    @Test
    @DisplayName("GET /api/opcua/pipeline/status - 200 정상 조회")
    void getStatus_returns200() throws Exception {
        OpcuaPipelineAppService.PipelineStatusResult result =
                new OpcuaPipelineAppService.PipelineStatusResult(
                        1000, 200_000, false, 0.5,
                        "CONNECTED", "CONNECTED", 12.5,
                        3, 100, 0
                );
        given(pipelineAppService.getStatus()).willReturn(result);

        mockMvc.perform(get("/api/opcua/pipeline/status"))
                .andExpect(status().isOk());
    }

    @Test
    @DisplayName("GET /api/opcua/pipeline/edges - 200 빈 목록")
    void getEdges_returns200() throws Exception {
        given(pipelineAppService.getEdgeStatuses()).willReturn(List.of());

        mockMvc.perform(get("/api/opcua/pipeline/edges"))
                .andExpect(status().isOk());
    }

    @Test
    @DisplayName("GET /api/opcua/pipeline/pending - 200 페이지 응답")
    void getPending_returns200() throws Exception {
        Page<com.peakmate.backend.domain.aas.entity.OpcuaBatchPending> page =
                new PageImpl<>(List.of(), PageRequest.of(0, 20), 0);
        given(pipelineAppService.getPendingList(anyList(), any())).willReturn(page);

        mockMvc.perform(get("/api/opcua/pipeline/pending"))
                .andExpect(status().isOk());
    }

    @Test
    @DisplayName("POST /api/opcua/pipeline/pending/999/retry - 404 존재하지 않는 ID")
    void retryPending_notFound_returns404() throws Exception {
        given(pipelineAppService.retryPending(999L))
                .willThrow(new EntityNotFoundException("Pending ID=999 없음"));

        mockMvc.perform(post("/api/opcua/pipeline/pending/999/retry")
                        .contentType(MediaType.APPLICATION_JSON))
                .andExpect(status().isNotFound());
    }
}
