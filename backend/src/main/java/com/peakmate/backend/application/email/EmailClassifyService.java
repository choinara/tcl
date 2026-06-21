package com.peakmate.backend.application.email;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.peakmate.backend.domain.email.entity.EmailAiUsage;
import com.peakmate.backend.domain.email.entity.EmailClassificationTemplate;
import com.peakmate.backend.domain.email.entity.EmailMessage;
import com.peakmate.backend.domain.email.repository.EmailAiUsageRepository;
import com.peakmate.backend.domain.email.repository.EmailClassificationTemplateRepository;
import com.peakmate.backend.domain.email.repository.EmailMessageRepository;
import com.peakmate.backend.domain.log.service.SystemLogService;
import com.peakmate.backend.infra.config.EmailAiProperties;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.*;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.client.RestTemplate;

import jakarta.persistence.EntityManager;
import jakarta.persistence.PersistenceContext;
import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.OffsetDateTime;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

@Slf4j
@Service
@RequiredArgsConstructor
public class EmailClassifyService {

    private static final String ANTHROPIC_API_URL = "https://api.anthropic.com/v1/messages";
    private static final BigDecimal CONFIDENCE_THRESHOLD = new BigDecimal("0.70");

    // 모델 변경 시 수동 수정 필요 (모델별 단가가 다름 — EmailAiProperties에 단가 필드 추가는 B-7 범위 초과)
    private static final BigDecimal INPUT_COST_PER_MTOK  = new BigDecimal("3.0");   // Claude Sonnet $3/MTok
    private static final BigDecimal OUTPUT_COST_PER_MTOK = new BigDecimal("15.0");  // Claude Sonnet $15/MTok

    private static final String FALLBACK_SYSTEM_PROMPT = """
            당신은 국제 물류 포워딩 회사(TCL)의 이메일 분류 AI입니다.
            수신된 B2B 이메일을 읽고, 발신자의 업무 목적을 아래 카테고리 중 하나로 분류하세요.

            카테고리:
            - FREIGHT_INQUIRY: 운임 문의, 견적 요청, 단가 확인, 운임 협의
            - BOOKING: 부킹/SR 요청, 선복 문의, 예약 확인, 스케줄 요청
            - BL_DOCS: B/L 요청, 선적서류(패킹리스트·인보이스·CO), AWB, 수출신고, 서류 수정
            - TRACKING: 컨테이너 추적, 선박 위치, ETA/ETD 확인, 도착 예정 문의
            - CUSTOMS: 통관 문의, 관부과세, HS CODE, 수입신고, 관세청 서류
            - OTHER: 위 카테고리에 해당하지 않는 경우

            응답 형식 (JSON만 반환, 마크다운 코드블록 없이):
            {"purpose": "카테고리코드", "confidence": 0.00, "summary": "한 문장 요약"}

            규칙:
            - confidence는 0.00~1.00 사이 소수 2자리
            - summary는 50자 이내 한국어
            - 내용이 불분명하면 OTHER + confidence 0.50
            """;

    private static final String PROMPT_PREFIX = """
            당신은 국제 물류 포워딩 회사(TCL)의 이메일 분류 AI입니다.
            수신된 B2B 이메일을 읽고, 발신자의 업무 목적을 아래 카테고리 중 하나로 분류하세요.

            카테고리:
            """;

    private static final String PROMPT_SUFFIX = """

            응답 형식 (JSON만 반환, 마크다운 코드블록 없이):
            {"purpose": "카테고리코드", "confidence": 0.00, "summary": "한 문장 요약"}

            규칙:
            - confidence는 0.00~1.00 사이 소수 2자리
            - summary는 50자 이내 한국어
            - 내용이 불분명하면 OTHER + confidence 0.50
            """;

    private final RestTemplate restTemplate;
    private final ObjectMapper objectMapper;
    private final EmailMessageRepository messageRepository;
    private final EmailAiProperties emailAiProperties;
    private final EmailClassificationTemplateRepository templateRepository;
    private final EmailAiUsageRepository aiUsageRepository;
    private final SystemLogService systemLogService;

    @PersistenceContext
    private EntityManager entityManager;

    // lazy init — classifyPendingEmails()의 기존 @Transactional 재활용
    // volatile: 스케줄러 자동 실행 + 수동 트리거 동시 접근 시 race condition 방지 (write는 최초 1회)
    private volatile String systemPrompt;

    public record ClassifyResult(int total, int classified, int unassigned, int failed) {}

    @Transactional
    public ClassifyResult classifyPendingEmails() {
        List<EmailMessage> pending = messageRepository.findByProcessingStatusOrderByReceivedAtAsc("PENDING");
        log.info("AI 분류 시작: PENDING {} 건", pending.size());

        int classified = 0, unassigned = 0, failed = 0;

        String apiKey = resolveApiKey();
        if (apiKey == null || apiKey.isBlank() || "placeholder".equals(apiKey)) {
            log.warn("AI API 키 미설정 — 분류 건너뜀. app.email.ai.api-key 또는 system_settings 확인 필요");
            return new ClassifyResult(pending.size(), 0, 0, pending.size());
        }

        String prompt = getSystemPrompt();

        for (EmailMessage msg : pending) {
            try {
                ClassificationResponse resp = callClaude(msg, apiKey, prompt);
                if (resp.confidence().compareTo(CONFIDENCE_THRESHOLD) >= 0) {
                    msg.markClassified(resp.purpose(), resp.confidence(), resp.summary(),
                            null, null, null, null, null);
                    classified++;
                } else {
                    msg.markUnassigned(resp.purpose(), resp.confidence(), resp.summary());
                    unassigned++;
                }
            } catch (Exception e) {
                failed++;
                log.warn("이메일 분류 실패 — 건너뜀: id={}, error={}", msg.getId(), e.getMessage());
            }
        }

        log.info("AI 분류 완료: total={}, classified={}, unassigned={}, failed={}",
                pending.size(), classified, unassigned, failed);

        int total = pending.size();
        int fc = classified, fu = unassigned, ff = failed;
        try {
            systemLogService.log("DATA_IMPORT", null, "SYSTEM", null,
                    "EMAIL_CLASSIFY",
                    String.format("total=%d, classified=%d, unassigned=%d, failed=%d", total, fc, fu, ff));
        } catch (Exception e) {
            log.warn("시스템 로그 기록 실패: {}", e.getMessage());
        }

        return new ClassifyResult(total, fc, fu, ff);
    }

    private String getSystemPrompt() {
        if (systemPrompt == null) {
            systemPrompt = buildSystemPrompt();
        }
        return systemPrompt;
    }

    private String buildSystemPrompt() {
        List<EmailClassificationTemplate> templates = templateRepository.findByIsActiveOrderBySortOrderAsc("Y");
        if (templates.isEmpty()) {
            log.warn("email_classification_template 데이터 없음 — 폴백 프롬프트 사용");
            return FALLBACK_SYSTEM_PROMPT;
        }
        StringBuilder categories = new StringBuilder();
        for (EmailClassificationTemplate t : templates) {
            String hint = extractPromptHint(t.getFieldMapping());
            categories.append("- ").append(t.getPurposeCode())
                    .append(": ").append(hint).append("\n");
        }
        return PROMPT_PREFIX + categories + PROMPT_SUFFIX;
    }

    private String extractPromptHint(String fieldMappingJson) {
        try {
            JsonNode node = objectMapper.readTree(fieldMappingJson);
            String hint = node.path("promptHint").asText("");
            return hint.isBlank() ? node.path("description").asText("") : hint;
        } catch (Exception e) {
            return "";
        }
    }

    private ClassificationResponse callClaude(EmailMessage msg, String apiKey, String prompt) throws Exception {
        String userPrompt = buildUserPrompt(msg);

        Map<String, Object> userMessage = new LinkedHashMap<>();
        userMessage.put("role", "user");
        userMessage.put("content", userPrompt);

        Map<String, Object> requestBody = new LinkedHashMap<>();
        requestBody.put("model", emailAiProperties.getModel());
        requestBody.put("max_tokens", emailAiProperties.getMaxTokens());
        requestBody.put("system", prompt);
        requestBody.put("messages", List.of(userMessage));

        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.APPLICATION_JSON);
        headers.set("x-api-key", apiKey);
        headers.set("anthropic-version", "2023-06-01");

        HttpEntity<Map<String, Object>> entity = new HttpEntity<>(requestBody, headers);

        log.debug("Claude 분류 요청: id={}, subject={}", msg.getId(),
                msg.getSubject() != null ? msg.getSubject().substring(0, Math.min(50, msg.getSubject().length())) : "");

        ResponseEntity<Map> response = restTemplate.exchange(
                ANTHROPIC_API_URL, HttpMethod.POST, entity, Map.class);

        if (!response.getStatusCode().is2xxSuccessful() || response.getBody() == null) {
            throw new RuntimeException("Claude API 호출 실패: " + response.getStatusCode());
        }

        ClaudeResponse claudeResponse = extractResponse(response.getBody());
        saveAiUsage(msg.getId(), claudeResponse);
        return parseClassification(claudeResponse.text());
    }

    private String buildUserPrompt(EmailMessage msg) {
        String subject = msg.getSubject() != null ? msg.getSubject() : "(제목 없음)";
        String sender = msg.getSenderEmail() != null ? msg.getSenderEmail() : "";
        String body = msg.getBodyText();
        if (body == null || body.isBlank()) {
            body = "(본문 없음)";
        } else if (body.length() > 2000) {
            body = body.substring(0, 2000) + "...(생략)";
        }
        return "발신자: " + sender + "\n제목: " + subject + "\n\n본문:\n" + body;
    }

    @SuppressWarnings("unchecked")
    private ClaudeResponse extractResponse(Map<?, ?> responseBody) {
        List<Map<String, Object>> content = (List<Map<String, Object>>) responseBody.get("content");
        if (content == null || content.isEmpty()) {
            throw new RuntimeException("Claude API 응답에 content가 없습니다");
        }
        String text = (String) content.get(0).get("text");

        int inputTokens = 0;
        int outputTokens = 0;
        Map<String, Object> usage = (Map<String, Object>) responseBody.get("usage");
        if (usage != null) {
            inputTokens  = usage.get("input_tokens")  instanceof Number n ? n.intValue() : 0;
            outputTokens = usage.get("output_tokens") instanceof Number n ? n.intValue() : 0;
            log.debug("  [토큰 사용] input={}, output={}", inputTokens, outputTokens);
        }
        return new ClaudeResponse(text, inputTokens, outputTokens);
    }

    private void saveAiUsage(Long emailMessageId, ClaudeResponse cr) {
        try {
            BigDecimal cost = BigDecimal.valueOf(cr.inputTokens())
                    .multiply(INPUT_COST_PER_MTOK)
                    .divide(BigDecimal.valueOf(1_000_000), 6, RoundingMode.HALF_UP)
                    .add(BigDecimal.valueOf(cr.outputTokens())
                            .multiply(OUTPUT_COST_PER_MTOK)
                            .divide(BigDecimal.valueOf(1_000_000), 6, RoundingMode.HALF_UP));

            aiUsageRepository.save(EmailAiUsage.create(
                    emailMessageId,
                    emailAiProperties.getModel(),
                    "CLASSIFY",
                    cr.inputTokens(),
                    cr.outputTokens(),
                    cost,
                    OffsetDateTime.now()));
        } catch (Exception e) {
            log.warn("AI 사용량 저장 실패 (분류 계속): id={}, error={}", emailMessageId, e.getMessage());
        }
    }

    private ClassificationResponse parseClassification(String text) throws Exception {
        String json = text.strip();
        if (json.startsWith("```")) {
            String[] lines = json.split("\n");
            StringBuilder sb = new StringBuilder();
            for (int i = 1; i < lines.length; i++) {
                if (lines[i].startsWith("```")) break;
                sb.append(lines[i]).append("\n");
            }
            json = sb.toString().strip();
        }
        JsonNode node = objectMapper.readTree(json);
        String purpose = node.path("purpose").asText("OTHER");
        BigDecimal confidence = new BigDecimal(
                String.format("%.2f", node.path("confidence").asDouble(0.50)));

        String rawSummary = node.path("summary").asText("");
        // AI가 50자 지시를 어길 경우 VARCHAR(200) DB 오류 방지
        String summary = rawSummary.length() > 200 ? rawSummary.substring(0, 200) : rawSummary;

        return new ClassificationResponse(purpose, confidence, summary);
    }

    /** DB(system_setting) → application.yml 순으로 API 키 조회 */
    @SuppressWarnings("unchecked")
    private String resolveApiKey() {
        try {
            List<String> results = entityManager.createNativeQuery(
                    "SELECT setting_value FROM system_setting " +
                    "WHERE setting_key = 'app.email.ai.api-key'")
                    .getResultList();
            if (!results.isEmpty()) {
                String dbValue = results.get(0);
                if (dbValue != null && !dbValue.isBlank()) return dbValue;
            }
        } catch (Exception e) {
            log.debug("DB에서 이메일 AI API 키 조회 실패, yml 폴백: {}", e.getMessage());
        }
        return emailAiProperties.getApiKey();
    }

    private record ClaudeResponse(String text, Integer inputTokens, Integer outputTokens) {}

    private record ClassificationResponse(String purpose, BigDecimal confidence, String summary) {}
}
