package com.peakmate.backend.application.receipt;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.peakmate.backend.interfaces.receipt.dto.OcrResultDto;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.context.annotation.Primary;
import org.springframework.http.*;
import org.springframework.stereotype.Component;
import org.springframework.web.client.RestTemplate;
import org.springframework.web.multipart.MultipartFile;

import jakarta.persistence.EntityManager;
import jakarta.persistence.PersistenceContext;
import java.io.IOException;
import java.util.*;

/**
 * Anthropic Claude API 기반 OCR 구현체 — OrbitMES ReceiptOcrService 변환.
 * ocr.anthropic.api-key 설정 시 StubOcrExtractor 대신 활성화됨.
 */
@Component
@Primary
@ConditionalOnProperty(name = "ocr.anthropic.api-key")
@Slf4j
public class AnthropicOcrExtractor implements OcrExtractor {

    private static final String ANTHROPIC_API_URL = "https://api.anthropic.com/v1/messages";

    private static final Map<String, String> MODEL_MAP = Map.of(
            "claude-opus", "claude-opus-4-20250514",
            "claude-sonnet", "claude-sonnet-4-5-20250929",
            "claude-haiku", "claude-haiku-4-5-20251001"
    );

    private static final String RECEIPT_SYSTEM_PROMPT = """
            당신은 대한민국 영수증/간이영수증/카드전표/명세서 전문 OCR 시스템입니다.

            이미지/문서에서 영수증 데이터를 정확하게 추출하여 JSON 배열로 반환하세요.

            ## 추출 규칙

            1. **상호명(supplier.name)**: 영수증 상단의 가게/업체명을 추출하세요.
               - 택시 영수증: "개인택시", "법인택시", 또는 상호(경부교통 등)를 기록
               - 앱 캡처: "티머니택시(개인)", "카카오T" 등 앱에 표시된 이름
            2. **사업자번호(supplier.business_number)**: 있으면 추출하세요.
            3. **거래일시(transaction_date)**: 반드시 **YYYY-MM-DD HH:mm** 형식으로 변환하세요.
               - ⚠️ **시간(HH:mm)은 필수입니다!** 영수증에 시간이 있으면 반드시 포함하세요.
               - 택시 영수증: "거래 일시(Date)" 줄의 날짜와 시간을 모두 추출 (예: "2026-02-04 13:51")
               - 앱 캡처: "거래일시" 필드 값을 변환 (예: "2026.02.13 12:26" → "2026-02-13 12:26")
               - 날짜 형식 변환: YYYY.MM.DD → YYYY-MM-DD, YY.MM.DD → 20YY-MM-DD
               - 시간이 정말 없는 경우에만 YYYY-MM-DD로 기록
            4. **품목(items)**: 각 구매 항목을 추출하세요.
               - part_name: 품목명/메뉴명. 택시의 경우 "택시요금"
               - quantity: 수량 (기본 1)
               - unit_price: 단가
               - amount: 금액 (결제요금/요금총액/거래금액)
               - remarks: 비고 (교통비, 식비 등 용도 메모가 있으면)
            5. **합계(summary.total)**: 최종 결제 금액
            6. **손글씨 메모(handwritten_notes)**: 펜으로 적힌 장소, 용도, 메모 등을 추출하세요.
               이동장소, 출발지→도착지 정보가 있으면 반드시 기록하세요.

            ## 택시/교통 영수증 전용 규칙

            택시 영수증에는 두 가지 유형이 있습니다:

            ### A) 종이 택시 영수증 (프린터 인쇄)
            - "거래 일시(Date) : 2026-02-04 13:51" → transaction_date = "2026-02-04 13:51"
            - "결제요금(Total Fare) : 6,100원" 또는 "요금총액(Total Fare) : 6,100원" → summary.total = 6100
            - "승하차시간(Pick-up & Drop-off Time) : 13:41 - 13:51" → 참고 정보
            - 손글씨로 적힌 이동 경로 (예: "SBS→홈플러스상암월드컵점")를 handwritten_notes에 기록

            ### B) 모바일 앱 캡처/인쇄물 (T머니택시, 카카오T 등)
            - 앱 화면을 캡처하거나 인쇄한 형태로, UI 버튼/레이아웃이 보임
            - "거래일시: 2026.02.13 12:26" → transaction_date = "2026-02-13 12:26"
            - "거래금액: -6,300원" → summary.total = 6300 (부호 제거)
            - "운행 정보" 섹션의 출발/도착 정보를 handwritten_notes에 기록
              (예: "출발: 이브자리 홈플러스상암월드컵점 / 도착: SBS프리즘타워")
            - "운행 시간: 12:18 - 12:26" → 참고 정보
            - 한 이미지에 여러 앱 캡처가 나란히 있으면 각각 별도의 JSON 객체로 추출

            ## 다중 영수증 처리

            - PDF 문서의 각 페이지가 별도의 영수증이면 각각 별도의 JSON 객체로 반환하세요.
            - **한 이미지/페이지에 영수증이 여러 개 나란히 있으면 각각 별도의 JSON 객체로 반환하세요.**
            - 한 이미지/페이지에 영수증이 1개여도 반드시 JSON 배열로 감싸서 반환하세요.
            - 영수증이 아닌 페이지(빈 페이지, 표지 등)는 무시하세요.

            ## 주의사항

            - 영수증에 여러 항목이 있으면 각각 별도 item으로 기록하세요.
            - 금액에서 쉼표, 원, ₩, 마이너스 부호 등은 제거하고 양수 숫자만 추출하세요.
            - 카드 결제 영수증의 경우 승인번호를 document_code에 기록하세요.
            - 택시/교통 영수증의 경우 출발지→도착지를 handwritten_notes에 기록하세요.
            - 읽을 수 없는 금액은 0으로, 읽을 수 없는 텍스트는 null로 기록하세요.
            """;

    private static final String RECEIPT_USER_PROMPT = """
            이 문서/이미지에서 모든 영수증 데이터를 추출하여 아래 JSON 스키마에 맞게 반환하세요.
            여러 영수증(여러 페이지)이 있으면 각각 별도의 JSON 객체로 반환하세요.

            반드시 JSON 배열만 반환하세요 (마크다운 코드블록 없이, 영수증이 1개여도 배열로).

            JSON 스키마:
            [
              {
                "supplier": {
                  "name": "상호명",
                  "business_number": "사업자번호 (없으면 null)",
                  "representative": "대표자명 (없으면 null)",
                  "phone": "전화번호 (없으면 null)",
                  "fax": null,
                  "address": "주소 (없으면 null)"
                },
                "transaction_date": "YYYY-MM-DD HH:mm",
                "document_code": "승인번호/전표번호 (없으면 null)",
                "receiver_name": null,
                "receiver_contact": null,
                "items": [
                  {
                    "seq": 순번,
                    "part_number": "RECEIPT",
                    "part_name": "품목명/메뉴명",
                    "model": null,
                    "quantity": 수량,
                    "unit_price": 단가,
                    "amount": 금액,
                    "remarks": "용도메모 (없으면 null)"
                  }
                ],
                "summary": {
                  "supply_amount": 공급가액,
                  "vat": 부가세,
                  "total": 합계금액,
                  "outstanding_balance": null
                },
                "handwritten_notes": "손글씨 메모/이동장소 (없으면 null)"
              }
            ]""";

    private static final Map<String, String> MEDIA_TYPES = Map.of(
            "jpg", "image/jpeg",
            "jpeg", "image/jpeg",
            "png", "image/png",
            "gif", "image/gif",
            "webp", "image/webp",
            "pdf", "application/pdf"
    );

    private final RestTemplate restTemplate;
    private final ObjectMapper objectMapper;

    @Value("${ocr.anthropic.api-key:}")
    private String configApiKey;

    @Value("${ocr.anthropic.model:claude-sonnet-4-5-20250929}")
    private String configModel;

    @Value("${ocr.anthropic.max-tokens:4096}")
    private int maxTokens;

    @PersistenceContext
    private EntityManager entityManager;

    public AnthropicOcrExtractor(RestTemplate restTemplate, ObjectMapper objectMapper) {
        this.restTemplate = restTemplate;
        this.objectMapper = objectMapper;
    }

    @Override
    public List<OcrResultDto> extract(MultipartFile file, String modelKey) throws IOException {
        String effectiveApiKey = resolveApiKey();
        if (effectiveApiKey == null || effectiveApiKey.isBlank()) {
            throw new IllegalStateException(
                    "ANTHROPIC_API_KEY가 설정되지 않았습니다. 시스템설정 > 보안설정에서 API 키를 등록하세요.");
        }

        String effectiveModel = resolveModel(modelKey);
        String mediaType = resolveMediaType(file);
        String base64Data = Base64.getEncoder().encodeToString(file.getBytes());

        Map<String, Object> requestBody = buildApiRequest(base64Data, mediaType, effectiveModel);

        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.APPLICATION_JSON);
        headers.set("x-api-key", effectiveApiKey);
        headers.set("anthropic-version", "2023-06-01");

        HttpEntity<Map<String, Object>> entity = new HttpEntity<>(requestBody, headers);

        log.info("영수증 OCR 요청 시작: model={}, file={}, size={}KB",
                effectiveModel, file.getOriginalFilename(), file.getSize() / 1024);

        ResponseEntity<Map> response = restTemplate.exchange(
                ANTHROPIC_API_URL, HttpMethod.POST, entity, Map.class);

        if (!response.getStatusCode().is2xxSuccessful() || response.getBody() == null) {
            log.error("Anthropic API 호출 실패: statusCode={}", response.getStatusCode());
            throw new RuntimeException("OCR 처리 중 오류가 발생했습니다");
        }

        String rawText = extractTextFromResponse(response.getBody());
        log.info("영수증 OCR 응답 수신: {} chars", rawText.length());

        List<OcrResultDto> results = parseOcrResponse(rawText);

        OcrResultDto.ValidationDto validation = OcrResultDto.ValidationDto.builder()
                .isValid(true)
                .errors(List.of())
                .warnings(List.of())
                .build();
        for (OcrResultDto result : results) {
            result.setValidation(validation);
        }

        return results;
    }

    /** DB(system_settings) → application.yml 순으로 API 키 조회 */
    private String resolveApiKey() {
        try {
            @SuppressWarnings("unchecked")
            List<String> results = entityManager.createNativeQuery(
                    "SELECT setting_value FROM system_settings " +
                    "WHERE setting_key = 'ocr.anthropic.api-key' AND enabled = true")
                    .getResultList();
            if (!results.isEmpty()) {
                String dbValue = results.get(0);
                if (dbValue != null && !dbValue.isBlank()) {
                    return dbValue;
                }
            }
        } catch (Exception e) {
            log.debug("DB에서 OCR API 키 조회 실패, application.yml 폴백: {}", e.getMessage());
        }
        return configApiKey;
    }

    /** 프론트 모델 키 → 실제 Anthropic 모델 ID */
    private String resolveModel(String modelKey) {
        if (modelKey == null || modelKey.isBlank()) {
            return configModel;
        }
        return MODEL_MAP.getOrDefault(modelKey, configModel);
    }

    private String resolveMediaType(MultipartFile file) {
        String originalFilename = file.getOriginalFilename();
        if (originalFilename == null) {
            throw new IllegalArgumentException("파일명이 없습니다.");
        }
        String extension = originalFilename.substring(originalFilename.lastIndexOf('.') + 1).toLowerCase();
        String mediaType = MEDIA_TYPES.get(extension);
        if (mediaType == null) {
            throw new IllegalArgumentException("지원하지 않는 이미지 포맷: " + extension);
        }
        return mediaType;
    }

    private Map<String, Object> buildApiRequest(String base64Data, String mediaType, String modelId) {
        boolean isPdf = "application/pdf".equals(mediaType);

        Map<String, Object> source = new LinkedHashMap<>();
        source.put("type", "base64");
        source.put("media_type", mediaType);
        source.put("data", base64Data);

        Map<String, Object> fileContent = new LinkedHashMap<>();
        fileContent.put("type", isPdf ? "document" : "image");
        fileContent.put("source", source);

        Map<String, Object> textContent = new LinkedHashMap<>();
        textContent.put("type", "text");
        textContent.put("text", RECEIPT_USER_PROMPT);

        Map<String, Object> userMessage = new LinkedHashMap<>();
        userMessage.put("role", "user");
        userMessage.put("content", List.of(fileContent, textContent));

        Map<String, Object> requestBody = new LinkedHashMap<>();
        requestBody.put("model", modelId);
        requestBody.put("max_tokens", maxTokens);
        requestBody.put("system", RECEIPT_SYSTEM_PROMPT);
        requestBody.put("messages", List.of(userMessage));

        return requestBody;
    }

    @SuppressWarnings("unchecked")
    private String extractTextFromResponse(Map<?, ?> responseBody) {
        List<Map<String, Object>> content = (List<Map<String, Object>>) responseBody.get("content");
        if (content == null || content.isEmpty()) {
            log.error("Anthropic API 응답에 content가 없습니다");
            throw new RuntimeException("OCR 응답을 처리할 수 없습니다");
        }

        Map<String, Object> usage = (Map<String, Object>) responseBody.get("usage");
        if (usage != null) {
            log.info("  [토큰 사용] input: {}, output: {}",
                    usage.get("input_tokens"), usage.get("output_tokens"));
        }

        return (String) content.get(0).get("text");
    }

    private List<OcrResultDto> parseOcrResponse(String rawText) {
        String json = rawText.strip();

        if (json.startsWith("```")) {
            String[] lines = json.split("\n");
            json = String.join("\n", Arrays.copyOfRange(lines, 1, lines.length - 1));
        }

        try {
            if (json.startsWith("[")) {
                return objectMapper.readValue(json,
                        objectMapper.getTypeFactory().constructCollectionType(List.class, OcrResultDto.class));
            }
            return List.of(objectMapper.readValue(json, OcrResultDto.class));
        } catch (Exception e) {
            log.error("영수증 OCR JSON 파싱 실패: {}", json.substring(0, Math.min(json.length(), 200)));
            throw new RuntimeException("OCR 결과 처리에 실패했습니다", e);
        }
    }
}
