package com.peakmate.backend.application.email;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.peakmate.backend.domain.email.entity.EmailMessage;
import com.peakmate.backend.domain.email.repository.EmailMessageRepository;
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
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

@Slf4j
@Service
@RequiredArgsConstructor
public class EmailClassifyService {

    private static final String ANTHROPIC_API_URL = "https://api.anthropic.com/v1/messages";
    private static final BigDecimal CONFIDENCE_THRESHOLD = new BigDecimal("0.70");

    private static final String SYSTEM_PROMPT = """
            당신은 국제 물류 포워딩 회사(TCL)의 이메일 분류 AI입니다.
            수신된 B2B 이메일을 읽고, 발신자의 업무 목적을 아래 6가지 카테고리 중 하나로 분류하세요.

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

    private final RestTemplate restTemplate;
    private final ObjectMapper objectMapper;
    private final EmailMessageRepository messageRepository;
    private final EmailAiProperties emailAiProperties;

    @PersistenceContext
    private EntityManager entityManager;

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

        for (EmailMessage msg : pending) {
            try {
                ClassificationResponse resp = callClaude(msg, apiKey);
                if (resp.confidence().compareTo(CONFIDENCE_THRESHOLD) >= 0) {
                    msg.markClassified(resp.purpose(), resp.confidence(),
                            null, null, null, null, null);
                    classified++;
                } else {
                    msg.markUnassigned(resp.purpose(), resp.confidence());
                    unassigned++;
                }
            } catch (Exception e) {
                failed++;
                log.warn("이메일 분류 실패 — 건너뜀: id={}, error={}", msg.getId(), e.getMessage());
            }
        }

        log.info("AI 분류 완료: total={}, classified={}, unassigned={}, failed={}",
                pending.size(), classified, unassigned, failed);
        return new ClassifyResult(pending.size(), classified, unassigned, failed);
    }

    private ClassificationResponse callClaude(EmailMessage msg, String apiKey) throws Exception {
        String userPrompt = buildUserPrompt(msg);

        Map<String, Object> userMessage = new LinkedHashMap<>();
        userMessage.put("role", "user");
        userMessage.put("content", userPrompt);

        Map<String, Object> requestBody = new LinkedHashMap<>();
        requestBody.put("model", emailAiProperties.getModel());
        requestBody.put("max_tokens", emailAiProperties.getMaxTokens());
        requestBody.put("system", SYSTEM_PROMPT);
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

        String text = extractText(response.getBody());
        return parseClassification(text);
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
    private String extractText(Map<?, ?> responseBody) {
        List<Map<String, Object>> content = (List<Map<String, Object>>) responseBody.get("content");
        if (content == null || content.isEmpty()) {
            throw new RuntimeException("Claude API 응답에 content가 없습니다");
        }
        Map<String, Object> usage = (Map<String, Object>) responseBody.get("usage");
        if (usage != null) {
            log.debug("  [토큰 사용] input={}, output={}", usage.get("input_tokens"), usage.get("output_tokens"));
        }
        return (String) content.get(0).get("text");
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
        BigDecimal confidence = new BigDecimal(String.format("%.2f", node.path("confidence").asDouble(0.50)));
        return new ClassificationResponse(purpose, confidence);
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

    private record ClassificationResponse(String purpose, BigDecimal confidence) {}
}
