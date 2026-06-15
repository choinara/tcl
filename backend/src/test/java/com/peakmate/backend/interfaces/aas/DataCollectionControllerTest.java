package com.peakmate.backend.interfaces.aas;

import com.peakmate.backend.domain.aas.dto.CsvImportResult;
import com.peakmate.backend.domain.aas.dto.CsvImportResult.CsvErrorEntry;
import com.peakmate.backend.domain.aas.entity.DataSource;
import com.peakmate.backend.domain.aas.entity.OpcuaDataPoint;
import com.peakmate.backend.domain.aas.service.OpcuaDataPointDomainService;
import com.peakmate.backend.interfaces.aas.controller.DataCollectionController;
import com.peakmate.backend.domain.log.service.SystemLogService;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.autoconfigure.security.servlet.SecurityAutoConfiguration;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.context.annotation.ComponentScan;
import org.springframework.context.annotation.FilterType;
import org.springframework.http.MediaType;
import org.springframework.mock.web.MockMultipartFile;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import org.springframework.test.web.servlet.MockMvc;

import java.lang.reflect.Field;
import java.nio.charset.StandardCharsets;
import java.util.List;
import java.util.Optional;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.BDDMockito.given;
import static org.mockito.Mockito.verify;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultHandlers.print;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

/**
 * DataCollectionController 단위 테스트.
 * 데이터소스 CRUD, 수집항목 CRUD, engineering CSV Import, OPC-UA 노드 생성 API를 검증합니다.
 */
@WebMvcTest(
    controllers = DataCollectionController.class,
    excludeAutoConfiguration = SecurityAutoConfiguration.class,
    excludeFilters = @ComponentScan.Filter(
        type = FilterType.REGEX,
        pattern = "com\\.peakmate\\.backend\\.infra\\.security\\..*"
    )
)
@ActiveProfiles("test")
class DataCollectionControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @MockitoBean
    private SystemLogService systemLogService;

    @MockitoBean
    private OpcuaDataPointDomainService domainService;

    // =========================================================================
    // Data Source CRUD
    // =========================================================================

    @Test
    @DisplayName("GET /api/opcua/data-sources - 데이터소스 목록 조회")
    void getDataSources_returnsList() throws Exception {
        DataSource ds = DataSource.create("PLC-001", "PLC 1번", "plc",
                "modbus", "192.168.1.1", 502, null, null, "ACTIVE",
                null, null, null, null, null, null, null, null);
        given(domainService.getAllDataSources()).willReturn(List.of(ds));

        mockMvc.perform(get("/api/opcua/data-sources"))
                .andDo(print())
                .andExpect(status().isOk())
                .andExpect(jsonPath("$").isArray())
                .andExpect(jsonPath("$[0].source_id").value("PLC-001"))
                .andExpect(jsonPath("$[0].source_name").value("PLC 1번"))
                .andExpect(jsonPath("$[0].source_type").value("plc"));
    }

    @Test
    @DisplayName("POST /api/opcua/data-sources - 데이터소스 생성 성공")
    void createDataSource_success() throws Exception {
        given(domainService.findDataSourceById("PLC-002")).willReturn(Optional.empty());
        DataSource saved = DataSource.create("PLC-002", "PLC 2번", "plc",
                "modbus", "192.168.1.2", 502, null, null, "ACTIVE",
                null, null, null, null, null, null, null, null);
        given(domainService.saveDataSource(any())).willReturn(saved);

        mockMvc.perform(post("/api/opcua/data-sources")
                .contentType(MediaType.APPLICATION_JSON)
                .content("""
                    {
                        "source_id": "PLC-002",
                        "source_name": "PLC 2번",
                        "source_type": "plc",
                        "plc_protocol": "modbus",
                        "plc_ip": "192.168.1.2",
                        "plc_port": 502,
                        "status": "ACTIVE"
                    }
                    """))
                .andDo(print())
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.source_id").value("PLC-002"));
    }

    @Test
    @DisplayName("POST /api/opcua/data-sources - 중복 소스ID 시 400 반환")
    void createDataSource_duplicateId_returns400() throws Exception {
        DataSource existing = DataSource.create("PLC-001", "기존", "plc",
                null, null, null, null, null, "ACTIVE",
                null, null, null, null, null, null, null, null);
        given(domainService.findDataSourceById("PLC-001")).willReturn(Optional.of(existing));

        mockMvc.perform(post("/api/opcua/data-sources")
                .contentType(MediaType.APPLICATION_JSON)
                .content("""
                    {
                        "source_id": "PLC-001",
                        "source_name": "중복 테스트",
                        "source_type": "plc"
                    }
                    """))
                .andDo(print())
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.detail").exists());
    }

    @Test
    @DisplayName("DELETE /api/opcua/data-sources/{id} - 존재하지 않는 소스 삭제 시 404")
    void deleteDataSource_notFound() throws Exception {
        given(domainService.findDataSourceById("NONE")).willReturn(Optional.empty());

        mockMvc.perform(delete("/api/opcua/data-sources/NONE"))
                .andDo(print())
                .andExpect(status().isNotFound());
    }

    // =========================================================================
    // Collection Items CRUD
    // =========================================================================

    @Test
    @DisplayName("GET /api/opcua/collection-items - 전체 수집항목 조회")
    void getCollectionItems_returnsList() throws Exception {
        OpcuaDataPoint dp = OpcuaDataPoint.create(
                "ns=2;s=Temp/UpTabHeat", "UpTabHeat", "상부탭예열",
                null, "Temperature", "Word", "C", 1000,
                "plc_direct", "D7801", null, null, true,
                null, null, null, null, null, null, null, null);
        given(domainService.getAllDataPoints()).willReturn(List.of(dp));

        mockMvc.perform(get("/api/opcua/collection-items"))
                .andDo(print())
                .andExpect(status().isOk())
                .andExpect(jsonPath("$").isArray())
                .andExpect(jsonPath("$[0].node_id").value("ns=2;s=Temp/UpTabHeat"))
                .andExpect(jsonPath("$[0].browse_name").value("UpTabHeat"))
                .andExpect(jsonPath("$[0].is_active").value(true));
    }

    @Test
    @DisplayName("GET /api/opcua/collection-items?instanceId=1 - 인스턴스별 수집항목 조회")
    void getCollectionItems_byInstance() throws Exception {
        OpcuaDataPoint dp = OpcuaDataPoint.create(
                "ns=2;s=DV-01A/Temperature/1stMLeftUp", "1stMLeftUp", "DV-01A",
                null, "Temperature", null, null, 1000,
                "OPC_UA", null, "/OperationalData/Temperature:1stMLeftUp", null, true,
                1L, "EDGE-01", "DV-01A", -1, null, null, null, null);
        given(domainService.getDataPointsByInstance(1L)).willReturn(List.of(dp));

        mockMvc.perform(get("/api/opcua/collection-items").param("instanceId", "1"))
                .andDo(print())
                .andExpect(status().isOk())
                .andExpect(jsonPath("$").isArray())
                .andExpect(jsonPath("$[0].asset_instance_id").value(1))
                .andExpect(jsonPath("$[0].equip_name").value("DV-01A"))
                .andExpect(jsonPath("$[0].edge_name").value("EDGE-01"));
    }

    @Test
    @DisplayName("POST /api/opcua/collection-items - 수집항목 생성 성공")
    void createCollectionItem_success() throws Exception {
        given(domainService.findByNodeId("ns=2;s=Test/New")).willReturn(Optional.empty());
        OpcuaDataPoint saved = OpcuaDataPoint.create(
                "ns=2;s=Test/New", "NewItem", "새항목",
                null, "Temperature", "Float", "C", 1000,
                "plc_direct", "D100", null, null, true,
                null, null, null, null, null, null, null, null);
        given(domainService.saveDataPoint(any())).willReturn(saved);

        mockMvc.perform(post("/api/opcua/collection-items")
                .contentType(MediaType.APPLICATION_JSON)
                .content("""
                    {
                        "node_id": "ns=2;s=Test/New",
                        "browse_name": "NewItem",
                        "category": "Temperature",
                        "data_type": "Float",
                        "unit": "C",
                        "sampling_ms": 1000,
                        "source_type": "plc_direct",
                        "plc_address": "D100",
                        "is_active": true
                    }
                    """))
                .andDo(print())
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.node_id").value("ns=2;s=Test/New"))
                .andExpect(jsonPath("$.browse_name").value("NewItem"));
    }

    @Test
    @DisplayName("POST /api/opcua/collection-items - 중복 nodeId 시 400")
    void createCollectionItem_duplicate_returns400() throws Exception {
        OpcuaDataPoint existing = OpcuaDataPoint.create(
                "ns=2;s=Test/Dup", "Dup", null, null, "Temperature", null, null,
                1000, null, null, null, null, true,
                null, null, null, null, null, null, null, null);
        given(domainService.findByNodeId("ns=2;s=Test/Dup")).willReturn(Optional.of(existing));

        mockMvc.perform(post("/api/opcua/collection-items")
                .contentType(MediaType.APPLICATION_JSON)
                .content("""
                    {
                        "node_id": "ns=2;s=Test/Dup",
                        "browse_name": "Dup",
                        "is_active": true
                    }
                    """))
                .andDo(print())
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.detail").exists());
    }

    @Test
    @DisplayName("DELETE /api/opcua/collection-items/{nodeId} - 존재하지 않는 항목 삭제 시 404")
    void deleteCollectionItem_notFound() throws Exception {
        given(domainService.findByNodeId("nonexistent")).willReturn(Optional.empty());

        mockMvc.perform(delete("/api/opcua/collection-items/nonexistent"))
                .andDo(print())
                .andExpect(status().isNotFound());
    }

    // =========================================================================
    // Helper: set ID via reflection (for entities with auto-generated PK)
    // =========================================================================

    private static void setId(Object entity, String fieldName, Object value) {
        try {
            Field field = entity.getClass().getDeclaredField(fieldName);
            field.setAccessible(true);
            field.set(entity, value);
        } catch (ReflectiveOperationException e) {
            throw new RuntimeException("테스트 ID 설정 실패", e);
        }
    }

    // =========================================================================
    // CSV Import
    // =========================================================================

    @Test
    @DisplayName("POST /collection-items/import-csv - engineering CSV 신규 등록")
    void importCsv_newRows() throws Exception {
        given(domainService.importFromCsv(any(), any()))
                .willReturn(new CsvImportResult(1, 0, List.of(), List.of()));

        MockMultipartFile csvFile = new MockMultipartFile(
                "file", "engineering_4F.csv", "text/csv",
                "header\nrow1\n".getBytes(StandardCharsets.UTF_8));

        mockMvc.perform(multipart("/api/opcua/collection-items/import-csv")
                .file(csvFile))
                .andDo(print())
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.inserted").value(1))
                .andExpect(jsonPath("$.updated").value(0))
                .andExpect(jsonPath("$.errors").isArray());
    }

    @Test
    @DisplayName("POST /collection-items/import-csv - upsert 기존 nodeId 갱신")
    void importCsv_upsertExisting() throws Exception {
        given(domainService.importFromCsv(any(), any()))
                .willReturn(new CsvImportResult(0, 1, List.of(), List.of()));

        MockMultipartFile csvFile = new MockMultipartFile(
                "file", "engineering_4F.csv", "text/csv",
                "header\nrow1\n".getBytes(StandardCharsets.UTF_8));

        mockMvc.perform(multipart("/api/opcua/collection-items/import-csv")
                .file(csvFile))
                .andDo(print())
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.inserted").value(0))
                .andExpect(jsonPath("$.updated").value(1));
    }

    @Test
    @DisplayName("POST /collection-items/import-csv - 빈 파일 시 400")
    void importCsv_emptyFile_returns400() throws Exception {
        MockMultipartFile emptyFile = new MockMultipartFile(
                "file", "empty.csv", "text/csv", new byte[0]);

        mockMvc.perform(multipart("/api/opcua/collection-items/import-csv")
                .file(emptyFile))
                .andDo(print())
                .andExpect(status().isBadRequest());
    }

    @Test
    @DisplayName("POST /collection-items/import-csv - instanceId 오버라이드")
    void importCsv_instanceIdOverride() throws Exception {
        given(domainService.importFromCsv(any(), eq(99L)))
                .willReturn(new CsvImportResult(1, 0, List.of(), List.of()));

        MockMultipartFile csvFile = new MockMultipartFile(
                "file", "test.csv", "text/csv",
                "header\nrow1\n".getBytes(StandardCharsets.UTF_8));

        mockMvc.perform(multipart("/api/opcua/collection-items/import-csv")
                .file(csvFile)
                .param("instanceId", "99"))
                .andDo(print())
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.inserted").value(1))
                .andExpect(jsonPath("$.unmatchedEquipNames").isEmpty());
    }

    @Test
    @DisplayName("POST /collection-items/import-csv - 매칭 실패 설비명 포함")
    void importCsv_unmatchedEquipNames() throws Exception {
        given(domainService.importFromCsv(any(), any()))
                .willReturn(new CsvImportResult(1, 0, List.of(), List.of("DV-99Z")));

        MockMultipartFile csvFile = new MockMultipartFile(
                "file", "test.csv", "text/csv",
                "header\nrow1\n".getBytes(StandardCharsets.UTF_8));

        mockMvc.perform(multipart("/api/opcua/collection-items/import-csv")
                .file(csvFile))
                .andDo(print())
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.inserted").value(1))
                .andExpect(jsonPath("$.unmatchedEquipNames[0]").value("DV-99Z"));
    }

    // =========================================================================
    // Data Source — test-connection
    // =========================================================================

    @Test
    @DisplayName("POST /api/opcua/data-sources/{sourceId}/test-connection - ACTIVE 상태 소스 → success:true")
    void testConnection_activeSource_returnsSuccess() throws Exception {
        DataSource ds = DataSource.create("PLC-001", "PLC 1번", "plc",
                "modbus", "192.168.1.1", 502, null, null, "ACTIVE",
                null, null, null, null, null, null, null, null);
        given(domainService.findDataSourceById("PLC-001")).willReturn(Optional.of(ds));

        mockMvc.perform(post("/api/opcua/data-sources/PLC-001/test-connection"))
                .andDo(print())
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.message").exists())
                .andExpect(jsonPath("$.latency_ms").exists());
    }

    @Test
    @DisplayName("POST /api/opcua/data-sources/{sourceId}/test-connection - INACTIVE 상태 소스 → success:false")
    void testConnection_inactiveSource_returnsFailure() throws Exception {
        DataSource ds = DataSource.create("PLC-002", "PLC 2번", "plc",
                null, null, null, null, null, "INACTIVE",
                null, null, null, null, null, null, null, null);
        given(domainService.findDataSourceById("PLC-002")).willReturn(Optional.of(ds));

        mockMvc.perform(post("/api/opcua/data-sources/PLC-002/test-connection"))
                .andDo(print())
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(false))
                .andExpect(jsonPath("$.message").exists());
    }

    @Test
    @DisplayName("POST /api/opcua/data-sources/{sourceId}/test-connection - 존재하지 않는 소스 → 404")
    void testConnection_notFound_returns404() throws Exception {
        given(domainService.findDataSourceById("NONE")).willReturn(Optional.empty());

        mockMvc.perform(post("/api/opcua/data-sources/NONE/test-connection"))
                .andDo(print())
                .andExpect(status().isNotFound());
    }

    // =========================================================================
    // OPC-UA Nodes
    // =========================================================================

    @Test
    @DisplayName("GET /api/opcua/nodes - Published 노드 목록 조회")
    void getNodes_returnsPublished() throws Exception {
        given(domainService.getPublishedNodes()).willReturn(List.of());

        mockMvc.perform(get("/api/opcua/nodes"))
                .andDo(print())
                .andExpect(status().isOk())
                .andExpect(jsonPath("$").isArray())
                .andExpect(jsonPath("$").isEmpty());
    }

    @Test
    @DisplayName("POST /api/opcua/nodes/generate - 노드 생성 성공")
    void generateNodes_success() throws Exception {
        given(domainService.generateNodes()).willReturn(5);

        mockMvc.perform(post("/api/opcua/nodes/generate"))
                .andDo(print())
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.created_count").value(5));
    }
}
