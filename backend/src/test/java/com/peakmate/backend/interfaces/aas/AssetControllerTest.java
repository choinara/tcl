package com.peakmate.backend.interfaces.aas;

import com.peakmate.backend.domain.aas.entity.AssetInstance;
import com.peakmate.backend.domain.aas.entity.AssetType;
import com.peakmate.backend.domain.aas.service.AssetDomainService;
import com.peakmate.backend.interfaces.aas.controller.AssetController;
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
import static org.mockito.BDDMockito.given;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultHandlers.print;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

/**
 * AssetController 단위 테스트.
 * Asset Type/Instance CRUD API를 검증합니다.
 */
@WebMvcTest(
    controllers = AssetController.class,
    excludeAutoConfiguration = SecurityAutoConfiguration.class,
    excludeFilters = @ComponentScan.Filter(
        type = FilterType.REGEX,
        pattern = "com\\.peakmate\\.backend\\.infra\\.security\\..*"
    )
)
@ActiveProfiles("test")
class AssetControllerTest {

    @Autowired
    private MockMvc mockMvc;
    @MockitoBean SystemLogService systemLogService;

    @MockitoBean
    private AssetDomainService assetDomainService;

    // =========================================================================
    // Asset Type
    // =========================================================================

    @Test
    @DisplayName("GET /api/aas/asset-types - 자산 유형 목록 조회")
    void getAssetTypes_returnsList() throws Exception {
        AssetType type = AssetType.create("equipment", "설비",
                null, "생산 설비 유형",
                List.of(Map.of("key", "serial", "label", "시리얼번호", "type", "text")));
        given(assetDomainService.getAllTypes()).willReturn(List.of(type));

        mockMvc.perform(get("/api/aas/asset-types"))
                .andDo(print())
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data").isArray())
                .andExpect(jsonPath("$.data[0].type_code").value("equipment"))
                .andExpect(jsonPath("$.data[0].type_name").value("설비"));
    }

    @Test
    @DisplayName("POST /api/aas/asset-types - 자산 유형 생성 성공")
    void createAssetType_success() throws Exception {
        given(assetDomainService.findByTypeCode("vision")).willReturn(Optional.empty());
        AssetType saved = AssetType.create("vision", "비전", null, "비전 검사기", List.of());
        given(assetDomainService.saveType(any())).willReturn(saved);

        mockMvc.perform(post("/api/aas/asset-types")
                .contentType(MediaType.APPLICATION_JSON)
                .content("""
                    {
                        "type_code": "vision",
                        "type_name": "비전",
                        "description": "비전 검사기",
                        "field_schema": []
                    }
                    """))
                .andDo(print())
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data.type_code").value("vision"));
    }

    @Test
    @DisplayName("POST /api/aas/asset-types - 중복 유형코드 시 오류 응답 반환")
    void createAssetType_duplicateCode_returnsError() throws Exception {
        AssetType existing = AssetType.create("equipment", "설비", null, null, List.of());
        given(assetDomainService.findByTypeCode("equipment")).willReturn(Optional.of(existing));

        mockMvc.perform(post("/api/aas/asset-types")
                .contentType(MediaType.APPLICATION_JSON)
                .content("""
                    {
                        "type_code": "equipment",
                        "type_name": "중복"
                    }
                    """))
                .andDo(print())
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(false))
                .andExpect(jsonPath("$.error.code").value("DUPLICATE_TYPE_CODE"));
    }

    // =========================================================================
    // Asset Instance
    // =========================================================================

    @Test
    @DisplayName("GET /api/aas/instances - 자산 인스턴스 목록 조회")
    void getAssetInstances_returnsList() throws Exception {
        AssetInstance inst = AssetInstance.create("EQUIP-001", "컨베이어 1호기",
                "equipment", null, null, null);
        given(assetDomainService.getAllInstances()).willReturn(List.of(inst));

        mockMvc.perform(get("/api/aas/instances"))
                .andDo(print())
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data").isArray())
                .andExpect(jsonPath("$.data[0].instance_id").value("EQUIP-001"))
                .andExpect(jsonPath("$.data[0].instance_name").value("컨베이어 1호기"));
    }

    @Test
    @DisplayName("POST /api/aas/instances - 존재하지 않는 인스턴스 수정 시 오류 응답")
    void updateAssetInstance_notFound_returnsError() throws Exception {
        given(assetDomainService.findInstanceById(999L)).willReturn(Optional.empty());

        mockMvc.perform(post("/api/aas/instances")
                .contentType(MediaType.APPLICATION_JSON)
                .content("""
                    {
                        "updated": [{"id": 999, "instanceName": "없는인스턴스", "typeCode": "equipment"}]
                    }
                    """))
                .andDo(print())
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(false))
                .andExpect(jsonPath("$.error.code").value("NOT_FOUND"));
    }
}
