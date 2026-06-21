package com.peakmate.backend.application.email;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.peakmate.backend.domain.email.entity.EmailClassificationTemplate;
import com.peakmate.backend.domain.email.repository.EmailAiUsageRepository;
import com.peakmate.backend.domain.email.repository.EmailClassificationTemplateRepository;
import com.peakmate.backend.domain.email.repository.EmailMessageRepository;
import com.peakmate.backend.domain.log.service.SystemLogService;
import com.peakmate.backend.infra.config.EmailAiProperties;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.test.util.ReflectionTestUtils;
import org.springframework.web.client.RestTemplate;

import jakarta.persistence.EntityManager;
import java.lang.reflect.Method;
import java.math.BigDecimal;
import java.util.List;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class EmailClassifyServiceTest {

    @InjectMocks
    private EmailClassifyService emailClassifyService;

    @Mock private EmailMessageRepository emailMessageRepository;
    @Mock private EmailClassificationTemplateRepository templateRepository;
    @Mock private EmailAiUsageRepository emailAiUsageRepository;
    @Mock private SystemLogService systemLogService;
    @Mock private EmailAiProperties emailAiProperties;
    @Mock private RestTemplate restTemplate;

    @BeforeEach
    void setUp() {
        // ObjectMapper: 실 인스턴스 사용 — parseClassification() 동작 검증에도 유리
        ReflectionTestUtils.setField(emailClassifyService, "objectMapper", new ObjectMapper());
        // EntityManager: @PersistenceContext 때문에 @Mock 자동 주입 불가
        EntityManager em = mock(EntityManager.class);
        ReflectionTestUtils.setField(emailClassifyService, "entityManager", em);
        // systemPrompt volatile 필드 초기화 (각 테스트 독립성 보장)
        ReflectionTestUtils.setField(emailClassifyService, "systemPrompt", null);
    }

    // ---- buildSystemPrompt ----

    @Test
    @DisplayName("buildSystemPrompt - 템플릿 존재 시 카테고리가 포함된 동적 프롬프트를 반환한다")
    void buildSystemPrompt_withTemplates_returnsDynamicPrompt() throws Exception {
        EmailClassificationTemplate t = buildTemplate("FREIGHT_INQUIRY", "운임 문의",
                "{\"promptHint\":\"운임 문의, 견적 요청\"}", 10);
        when(templateRepository.findByIsActiveOrderBySortOrderAsc("Y")).thenReturn(List.of(t));

        String prompt = invokeGetSystemPrompt();

        assertThat(prompt).contains("FREIGHT_INQUIRY");
        assertThat(prompt).contains("운임 문의, 견적 요청");
    }

    @Test
    @DisplayName("buildSystemPrompt - 템플릿이 비어있으면 폴백 프롬프트를 반환한다")
    void buildSystemPrompt_noTemplates_returnsFallback() throws Exception {
        when(templateRepository.findByIsActiveOrderBySortOrderAsc("Y")).thenReturn(List.of());

        String prompt = invokeGetSystemPrompt();

        assertThat(prompt).isNotBlank();
        assertThat(prompt).contains("FREIGHT_INQUIRY"); // 폴백에도 TCL 카테고리 포함
    }

    // ---- parseClassification ----

    @Test
    @DisplayName("parseClassification - 정상 JSON을 파싱한다 (purpose + confidence + summary)")
    void parseClassification_validJson_returnsParsedResult() throws Exception {
        String json = "{\"purpose\":\"BOOKING\",\"confidence\":0.92,\"summary\":\"부킹 요청 메일\"}";

        Object result = invokeParseClassification(json);

        assertThat(result).isNotNull();
        assertThat(getField(result, "purpose")).isEqualTo("BOOKING");
        assertThat(getField(result, "confidence")).isEqualTo(new BigDecimal("0.92"));
        assertThat(getField(result, "summary")).isEqualTo("부킹 요청 메일");
    }

    @Test
    @DisplayName("parseClassification - 마크다운 코드블록으로 감싸진 JSON을 파싱한다")
    void parseClassification_markdownWrapped_returnsParsedResult() throws Exception {
        String json = "```json\n{\"purpose\":\"TRACKING\",\"confidence\":0.85,\"summary\":\"ETA 문의\"}\n```";

        Object result = invokeParseClassification(json);

        assertThat(getField(result, "purpose")).isEqualTo("TRACKING");
        assertThat(getField(result, "confidence")).isEqualTo(new BigDecimal("0.85"));
    }

    @Test
    @DisplayName("parseClassification - 잘못된 JSON이면 예외를 던진다")
    void parseClassification_invalidJson_throwsException() {
        String badJson = "not-a-json";

        assertThatThrownBy(() -> invokeParseClassification(badJson))
                .isInstanceOf(Exception.class);
    }

    @Test
    @DisplayName("parseClassification - summary가 200자 초과이면 200자로 잘라낸다")
    void parseClassification_summaryOver200_truncatesTo200() throws Exception {
        String longSummary = "A".repeat(250);
        String json = "{\"purpose\":\"OTHER\",\"confidence\":0.50,\"summary\":\"" + longSummary + "\"}";

        Object result = invokeParseClassification(json);

        String summary = (String) getField(result, "summary");
        assertThat(summary).hasSize(200);
    }

    // ---- classifyPendingEmails ----

    @Test
    @DisplayName("classifyPendingEmails - API 키가 미설정이면 전체를 failed로 반환한다")
    void classifyPendingEmails_noApiKey_skipsAll() {
        when(emailMessageRepository.findByProcessingStatusOrderByReceivedAtAsc("PENDING"))
                .thenReturn(List.of());
        when(emailAiProperties.getApiKey()).thenReturn("placeholder");

        EmailClassifyService.ClassifyResult result = emailClassifyService.classifyPendingEmails();

        assertThat(result.classified()).isZero();
        assertThat(result.unassigned()).isZero();
    }

    // ---- helpers ----

    private String invokeGetSystemPrompt() throws Exception {
        Method m = EmailClassifyService.class.getDeclaredMethod("getSystemPrompt");
        m.setAccessible(true);
        return (String) m.invoke(emailClassifyService);
    }

    private Object invokeParseClassification(String text) throws Exception {
        Method m = EmailClassifyService.class.getDeclaredMethod("parseClassification", String.class);
        m.setAccessible(true);
        return m.invoke(emailClassifyService, text);
    }

    private Object getField(Object obj, String fieldName) throws Exception {
        var field = obj.getClass().getDeclaredField(fieldName);
        field.setAccessible(true);
        return field.get(obj);
    }

    private EmailClassificationTemplate buildTemplate(String code, String name,
                                                       String fieldMapping, int sortOrder) {
        return EmailClassificationTemplate.create(code, name, null, fieldMapping, sortOrder);
    }
}
