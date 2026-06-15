package com.peakmate.backend.interfaces.commoncode;

import com.peakmate.backend.domain.commoncode.entity.CommonCodeGroup;
import com.peakmate.backend.domain.commoncode.service.CommonCodeDomainService;
import com.peakmate.backend.infra.repository.commoncode.CommonCodeGroupJpaRepository;
import com.peakmate.backend.infra.repository.commoncode.CommonCodeJpaRepository;
import com.peakmate.backend.interfaces.commoncode.controller.CommonCodeController;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.autoconfigure.security.servlet.SecurityAutoConfiguration;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.context.annotation.ComponentScan;
import org.springframework.context.annotation.FilterType;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import com.peakmate.backend.domain.log.service.SystemLogService;import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.web.servlet.MockMvc;

import java.util.List;

import static org.mockito.BDDMockito.given;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultHandlers.print;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

/**
 * CommonCodeController 단위 테스트.
 *
 * <p>Security를 비활성화하고 컨트롤러 레이어만 테스트합니다.
 * 도메인 서비스 및 리포지토리는 Mock 처리합니다.</p>
 */
@WebMvcTest(
    controllers = CommonCodeController.class,
    excludeAutoConfiguration = SecurityAutoConfiguration.class,
    excludeFilters = @ComponentScan.Filter(
        type = FilterType.REGEX,
        pattern = "com\\.peakmate\\.backend\\.infra\\.security\\..*"
    )
)
@ActiveProfiles("test")
class CommonCodeControllerTest {

    @Autowired
    private MockMvc mockMvc;
    @MockitoBean SystemLogService systemLogService;

    @MockitoBean
    private com.peakmate.backend.domain.commoncode.service.CommonCodeUsageChecker commonCodeUsageChecker;

    @MockitoBean
    private CommonCodeDomainService commonCodeDomainService;

    @MockitoBean
    private CommonCodeJpaRepository commonCodeJpaRepository;

    @MockitoBean
    private CommonCodeGroupJpaRepository commonCodeGroupJpaRepository;

    @Test
    @DisplayName("GET /api/common-codes/groups - 공통코드 그룹 목록 조회")
    void getAllGroups_returnsGroupList() throws Exception {
        // given
        CommonCodeGroup group = CommonCodeGroup.create(
                "STATUS", "상태코드", "상태 관련 공통코드", 1, null, null
        );
        given(commonCodeDomainService.getAllGroups()).willReturn(List.of(group));

        // when & then
        mockMvc.perform(get("/api/common-codes/groups"))
                .andDo(print())
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data").isArray())
                .andExpect(jsonPath("$.data[0].groupCode").value("STATUS"))
                .andExpect(jsonPath("$.data[0].groupName").value("상태코드"));
    }

    @Test
    @DisplayName("GET /api/common-codes/groups - 빈 목록 반환")
    void getAllGroups_returnsEmptyList() throws Exception {
        // given
        given(commonCodeDomainService.getAllGroups()).willReturn(List.of());

        // when & then
        mockMvc.perform(get("/api/common-codes/groups"))
                .andDo(print())
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data").isArray())
                .andExpect(jsonPath("$.data").isEmpty());
    }
}
