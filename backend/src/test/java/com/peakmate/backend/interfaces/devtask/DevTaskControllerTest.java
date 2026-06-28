package com.peakmate.backend.interfaces.devtask;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.peakmate.backend.domain.devtask.entity.DevTask;
import com.peakmate.backend.domain.commoncode.service.CommonCodeDomainService;
import com.peakmate.backend.domain.log.service.SystemLogService;
import com.peakmate.backend.infra.repository.devtask.DevTaskJpaRepository;
import com.peakmate.backend.interfaces.devtask.controller.DevTaskController;
import com.peakmate.backend.interfaces.devtask.dto.request.DevTaskBatchRequest;
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
import org.springframework.test.web.servlet.MockMvc;

import java.util.List;
import java.util.Optional;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.BDDMockito.given;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultHandlers.print;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@WebMvcTest(
    controllers = DevTaskController.class,
    excludeAutoConfiguration = SecurityAutoConfiguration.class,
    excludeFilters = @ComponentScan.Filter(
        type = FilterType.REGEX,
        pattern = "com\\.peakmate\\.backend\\.infra\\.security\\..*"
    )
)
@ActiveProfiles("test")
class DevTaskControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    @MockitoBean
    private DevTaskJpaRepository devTaskRepository;

    @MockitoBean
    private SystemLogService systemLogService;

    @MockitoBean
    private CommonCodeDomainService commonCodeDomainService;

    @Test
    @DisplayName("GET /api/devtask/tasks — 전체 과제 목록 200 반환")
    void getTasks_returnsOk() throws Exception {
        DevTask task = DevTask.create("A1", null, "테스트 과제", "INFRA", "ENV_SETUP", "MEDIUM", "PENDING", "PHASE_1", null);
        given(devTaskRepository.findByUseYnOrderByIdAsc("Y")).willReturn(List.of(task));

        mockMvc.perform(get("/api/devtask/tasks").param("useYn", "Y"))
            .andDo(print())
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.data").isArray());
    }

    @Test
    @DisplayName("GET /api/devtask/tasks/stats — 통계 200 반환")
    void getStats_returnsOk() throws Exception {
        given(devTaskRepository.findByUseYnOrderByIdAsc("Y")).willReturn(List.of());
        given(commonCodeDomainService.getCodesByGroup("TASK_GROUP")).willReturn(List.of());

        mockMvc.perform(get("/api/devtask/tasks/stats"))
            .andDo(print())
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.data.total").value(0));
    }

    @Test
    @DisplayName("POST /api/devtask/tasks/batch — 중복 task_code 시 400 반환")
    void batchSave_duplicateTaskCode_returns400() throws Exception {
        DevTask existing = DevTask.create("DUP01", null, "기존 과제", "INFRA", "ENV_SETUP", "MEDIUM", "PENDING", "PHASE_1", null);
        given(devTaskRepository.findByTaskCode("DUP01")).willReturn(Optional.of(existing));

        DevTaskBatchRequest.DevTaskRow row = new DevTaskBatchRequest.DevTaskRow(
            null, "DUP01", null, "중복 과제", "INFRA", "ENV_SETUP",
            "MEDIUM", "PENDING", "PHASE_1", null, null, null, null,
            null, null, null, null, 0, null, "Y", "created"
        );
        DevTaskBatchRequest req = new DevTaskBatchRequest(List.of(row));

        mockMvc.perform(post("/api/devtask/tasks/batch")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(req)))
            .andDo(print())
            .andExpect(status().is4xxClientError());
    }

    @Test
    @DisplayName("POST /api/devtask/tasks/batch — 신규 과제 정상 저장 200 반환")
    void batchSave_created_returns200() throws Exception {
        given(devTaskRepository.findByTaskCode(anyString())).willReturn(Optional.empty());
        given(devTaskRepository.save(any(DevTask.class))).willAnswer(inv -> inv.getArgument(0));

        DevTaskBatchRequest.DevTaskRow row = new DevTaskBatchRequest.DevTaskRow(
            null, "NEW01", null, "신규 과제", "INFRA", "ENV_SETUP",
            "MEDIUM", "PENDING", "PHASE_1", null, null, null, null,
            null, null, null, null, 0, null, "Y", "created"
        );
        DevTaskBatchRequest req = new DevTaskBatchRequest(List.of(row));

        mockMvc.perform(post("/api/devtask/tasks/batch")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(req)))
            .andDo(print())
            .andExpect(status().isOk());
    }
}
