package com.peakmate.backend.interfaces.usertab;

import com.peakmate.backend.domain.admin.entity.AdminUser;
import com.peakmate.backend.domain.admin.repository.AdminUserRepository;
import com.peakmate.backend.domain.log.service.SystemLogService;
import com.peakmate.backend.domain.usertab.entity.UserOpenTab;
import com.peakmate.backend.domain.usertab.service.UserOpenTabDomainService;
import com.peakmate.backend.interfaces.usertab.controller.UserOpenTabController;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.autoconfigure.security.servlet.SecurityAutoConfiguration;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.context.annotation.ComponentScan;
import org.springframework.context.annotation.FilterType;
import org.springframework.http.MediaType;
import org.springframework.security.test.context.support.WithMockUser;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import org.springframework.test.web.servlet.MockMvc;

import java.util.List;
import java.util.Optional;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.BDDMockito.given;
import static org.mockito.Mockito.verify;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

/**
 * UserOpenTabController 단위 테스트.
 */
@WebMvcTest(
    controllers = UserOpenTabController.class,
    excludeAutoConfiguration = SecurityAutoConfiguration.class,
    excludeFilters = @ComponentScan.Filter(
        type = FilterType.REGEX,
        pattern = "com\\.peakmate\\.backend\\.infra\\.security\\..*"
    )
)
@ActiveProfiles("test")
class UserOpenTabControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @MockitoBean
    private UserOpenTabDomainService service;

    @MockitoBean
    private AdminUserRepository adminUserRepository;

    @MockitoBean
    private SystemLogService systemLogService;

    private static final Long USER_ID = 1L;
    private static final String USERNAME = "admin";

    private AdminUser mockAdminUser() {
        AdminUser user = AdminUser.create(USERNAME, "encoded", "Test User", "test@test.com", "010-0000-0000");
        // Reflection to set ID since it's auto-generated
        try {
            var field = AdminUser.class.getDeclaredField("id");
            field.setAccessible(true);
            field.set(user, USER_ID);
        } catch (Exception e) {
            throw new RuntimeException(e);
        }
        return user;
    }

    @Test
    @DisplayName("GET /api/auth/me/tab-session - 200 빈 응답 (신규 사용자)")
    @WithMockUser(username = USERNAME)
    void get_emptyResponse() throws Exception {
        given(adminUserRepository.findByUsername(USERNAME))
                .willReturn(Optional.of(mockAdminUser()));
        given(service.findByUser(USER_ID))
                .willReturn(List.of());

        mockMvc.perform(get("/api/auth/me/tab-session"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data.tabs").isArray())
                .andExpect(jsonPath("$.data.tabs").isEmpty())
                .andExpect(jsonPath("$.data.activePath").doesNotExist());
    }

    @Test
    @DisplayName("PUT + GET /api/auth/me/tab-session - 200 저장 후 조회 라운드트립")
    @WithMockUser(username = USERNAME)
    void put_thenGet_roundTrip() throws Exception {
        given(adminUserRepository.findByUsername(USERNAME))
                .willReturn(Optional.of(mockAdminUser()));

        // PUT 저장
        String body = """
                {
                    "tabs": [
                        {"path": "/warehouse/pre-inbound", "menuCode": "WH0010", "label": "가입고등록"},
                        {"path": "/production/plan", "menuCode": "PD0010", "label": "생산계획"}
                    ],
                    "activePath": "/warehouse/pre-inbound"
                }
                """;

        mockMvc.perform(put("/api/auth/me/tab-session")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(body))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true));

        verify(service).replaceAll(eq(USER_ID), any(), eq("/warehouse/pre-inbound"));

        // GET 조회 (서비스 mock으로 시뮬레이션)
        UserOpenTab tab1 = UserOpenTab.create(USER_ID, "/warehouse/pre-inbound", "WH0010", 0, true, "가입고등록");
        UserOpenTab tab2 = UserOpenTab.create(USER_ID, "/production/plan", "PD0010", 1, false, "생산계획");
        given(service.findByUser(USER_ID)).willReturn(List.of(tab1, tab2));

        mockMvc.perform(get("/api/auth/me/tab-session"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.tabs[0].path").value("/warehouse/pre-inbound"))
                .andExpect(jsonPath("$.data.tabs[1].path").value("/production/plan"))
                .andExpect(jsonPath("$.data.activePath").value("/warehouse/pre-inbound"));
    }

    @Test
    @DisplayName("PUT /api/auth/me/tab-session - 400 path 빈값 검증 실패")
    @WithMockUser(username = USERNAME)
    void put_invalidRequest_badRequest() throws Exception {
        given(adminUserRepository.findByUsername(USERNAME))
                .willReturn(Optional.of(mockAdminUser()));

        String body = """
                {
                    "tabs": [
                        {"path": "", "menuCode": null, "label": "빈경로"}
                    ],
                    "activePath": null
                }
                """;

        mockMvc.perform(put("/api/auth/me/tab-session")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(body))
                .andExpect(status().isBadRequest());
    }

    @Test
    @DisplayName("DELETE /api/auth/me/tab-session - 200 초기화")
    @WithMockUser(username = USERNAME)
    void delete_clearSession() throws Exception {
        given(adminUserRepository.findByUsername(USERNAME))
                .willReturn(Optional.of(mockAdminUser()));

        mockMvc.perform(delete("/api/auth/me/tab-session"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true));

        verify(service).clearAll(USER_ID);
    }
}
