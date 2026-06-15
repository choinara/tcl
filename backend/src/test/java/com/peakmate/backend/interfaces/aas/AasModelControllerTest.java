package com.peakmate.backend.interfaces.aas;

import com.peakmate.backend.domain.aas.dto.AasxParsedResult;
import com.peakmate.backend.domain.aas.dto.AasxParsedResult.ElementInfo;
import com.peakmate.backend.domain.aas.dto.AasxParsedResult.ShellInfo;
import com.peakmate.backend.domain.aas.dto.AasxParsedResult.SubmodelInfo;
import com.peakmate.backend.domain.aas.entity.AasxFile;
import com.peakmate.backend.domain.aas.service.AasModelDomainService;
import com.peakmate.backend.domain.aas.service.AasxParsingService;
import com.peakmate.backend.interfaces.aas.controller.AasModelController;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.autoconfigure.security.servlet.SecurityAutoConfiguration;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.context.annotation.ComponentScan;
import org.springframework.context.annotation.FilterType;
import org.springframework.mock.web.MockMultipartFile;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import com.peakmate.backend.domain.log.service.SystemLogService;import org.springframework.test.web.servlet.MockMvc;

import java.util.List;
import java.util.Optional;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.BDDMockito.given;
import static org.mockito.Mockito.verify;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultHandlers.print;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

/**
 * AasModelController 단위 테스트.
 * AASX 파일 업로드, 목록 조회, 삭제 API를 검증합니다.
 */
@WebMvcTest(
    controllers = AasModelController.class,
    excludeAutoConfiguration = SecurityAutoConfiguration.class,
    excludeFilters = @ComponentScan.Filter(
        type = FilterType.REGEX,
        pattern = "com\\.peakmate\\.backend\\.infra\\.security\\..*"
    )
)
@ActiveProfiles("test")
class AasModelControllerTest {

    @Autowired
    private MockMvc mockMvc;
    @MockitoBean SystemLogService systemLogService;

    @MockitoBean
    private AasModelDomainService aasModelDomainService;

    @MockitoBean
    private AasxParsingService aasxParsingService;

    @Test
    @DisplayName("GET /api/aas/aasx/list - AASX 파일 목록 조회")
    void listAasxFiles_returnsList() throws Exception {
        AasxFile file = AasxFile.create("test.aasx", "abc123", "/tmp/test.aasx", null, "3.0", 1, 2, 10);
        given(aasModelDomainService.getAasxFiles()).willReturn(List.of(file));

        mockMvc.perform(get("/api/aas/aasx/list"))
                .andDo(print())
                .andExpect(status().isOk())
                .andExpect(jsonPath("$").isArray())
                .andExpect(jsonPath("$[0].file_name").value("test.aasx"))
                .andExpect(jsonPath("$[0].aas_version").value("3.0"));
    }

    @Test
    @DisplayName("GET /api/aas/aasx/list - 빈 목록 반환")
    void listAasxFiles_returnsEmpty() throws Exception {
        given(aasModelDomainService.getAasxFiles()).willReturn(List.of());

        mockMvc.perform(get("/api/aas/aasx/list"))
                .andDo(print())
                .andExpect(status().isOk())
                .andExpect(jsonPath("$").isArray())
                .andExpect(jsonPath("$").isEmpty());
    }

    @Test
    @DisplayName("POST /api/aas/aasx/upload - AASX 파일 업로드 및 파싱 성공")
    void uploadAasx_success() throws Exception {
        MockMultipartFile file = new MockMultipartFile(
                "file", "sample.aasx",
                "application/octet-stream", "aasx-content".getBytes());

        // AasxParsingService Mock 설정
        AasxParsedResult mockParsed = new AasxParsedResult("3.0",
                List.of(new ShellInfo("ProductionEquipment", "urn:asset:001", "INSTANCE", "생산설비", "Production Equipment")),
                List.of(new SubmodelInfo("Nameplate", "urn:sm:nameplate", "ProductionEquipment", 3)),
                List.of(
                        new ElementInfo("Nameplate", "Manufacturer", "Property", "/Manufacturer", "STRING", "PeakMate", null, null, "제조사", "Manufacturer"),
                        new ElementInfo("Nameplate", "SerialNumber", "Property", "/SerialNumber", "STRING", "SN-001", null, null, "시리얼번호", "Serial Number"),
                        new ElementInfo("Nameplate", "RatedPower", "Property", "/RatedPower", "DOUBLE", "5.5", "kW", null, "정격출력", "Rated Power")
                ));
        given(aasxParsingService.parse(any(byte[].class))).willReturn(mockParsed);

        mockMvc.perform(multipart("/api/aas/aasx/upload").file(file))
                .andDo(print())
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.temp_file").exists())
                .andExpect(jsonPath("$.summary.file_name").value("sample.aasx"))
                .andExpect(jsonPath("$.summary.shell_count").value(1))
                .andExpect(jsonPath("$.summary.submodel_count").value(1))
                .andExpect(jsonPath("$.summary.element_count").value(3))
                .andExpect(jsonPath("$.parsed_data.shells[0].idShort").value("ProductionEquipment"))
                .andExpect(jsonPath("$.parsed_data.elements[0].id_short").value("Manufacturer"));
    }

    @Test
    @DisplayName("POST /api/aas/aasx/upload - 빈 파일 업로드 시 400")
    void uploadAasx_emptyFile_returns400() throws Exception {
        MockMultipartFile emptyFile = new MockMultipartFile(
                "file", "empty.aasx",
                "application/octet-stream", new byte[0]);

        mockMvc.perform(multipart("/api/aas/aasx/upload").file(emptyFile))
                .andDo(print())
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.detail").exists());
    }

    @Test
    @DisplayName("POST /api/aas/aasx/upload - 파싱 실패 시 400")
    void uploadAasx_parseFail_returns400() throws Exception {
        MockMultipartFile file = new MockMultipartFile(
                "file", "bad.aasx",
                "application/octet-stream", "invalid-data".getBytes());

        given(aasxParsingService.parse(any(byte[].class)))
                .willThrow(new IllegalArgumentException("AASX 파일 파싱에 실패했습니다: Invalid format"));

        mockMvc.perform(multipart("/api/aas/aasx/upload").file(file))
                .andDo(print())
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.detail").exists());
    }

    @Test
    @DisplayName("DELETE /api/aas/aasx/{id} - AASX 파일 삭제 성공")
    void deleteAasx_success() throws Exception {
        AasxFile file = AasxFile.create("test.aasx", "abc123", "/tmp/test.aasx", null, "3.0", 1, 2, 10);
        given(aasModelDomainService.findById(1L)).willReturn(Optional.of(file));

        mockMvc.perform(delete("/api/aas/aasx/1"))
                .andDo(print())
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.message").exists());

        verify(aasModelDomainService).deleteAasxFile(1L);
    }

    @Test
    @DisplayName("DELETE /api/aas/aasx/{id} - 존재하지 않는 파일 삭제 시 404")
    void deleteAasx_notFound() throws Exception {
        given(aasModelDomainService.findById(999L)).willReturn(Optional.empty());

        mockMvc.perform(delete("/api/aas/aasx/999"))
                .andDo(print())
                .andExpect(status().isNotFound());
    }
}
