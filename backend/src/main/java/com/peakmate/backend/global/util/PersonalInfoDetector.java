package com.peakmate.backend.global.util;

import java.util.ArrayList;
import java.util.List;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

/**
 * 개인정보 포함 여부 탐지 유틸리티.
 * 게시판 본문, 첨부파일 등에서 주민번호/전화번호/카드번호 등을 탐지합니다.
 */
public final class PersonalInfoDetector {

    private PersonalInfoDetector() {}

    private static final List<PiiPattern> PATTERNS = List.of(
            new PiiPattern("주민등록번호",
                    Pattern.compile("\\d{6}[- ]?[1-4]\\d{6}")),
            new PiiPattern("휴대전화번호",
                    Pattern.compile("01[016789][- ]?\\d{3,4}[- ]?\\d{4}")),
            new PiiPattern("일반전화번호",
                    Pattern.compile("0[2-6][0-9][- ]?\\d{3,4}[- ]?\\d{4}")),
            new PiiPattern("신용카드번호",
                    Pattern.compile("\\d{4}[- ]?\\d{4}[- ]?\\d{4}[- ]?\\d{4}")),
            new PiiPattern("계좌번호",
                    Pattern.compile("\\d{3}[- ]?\\d{2,6}[- ]?\\d{2,6}[- ]?\\d{1,4}")),
            new PiiPattern("이메일주소",
                    Pattern.compile("[a-zA-Z0-9._%+\\-]+@[a-zA-Z0-9.\\-]+\\.[a-zA-Z]{2,}")),
            new PiiPattern("여권번호",
                    Pattern.compile("[A-Z]{1,2}\\d{7,8}"))
    );

    /**
     * 텍스트에서 개인정보 포함 여부를 검사합니다.
     * @return 탐지된 개인정보 유형 목록 (비어있으면 미탐지)
     */
    public static List<DetectionResult> detect(String text) {
        if (text == null || text.isBlank()) return List.of();

        List<DetectionResult> results = new ArrayList<>();
        for (PiiPattern pp : PATTERNS) {
            Matcher matcher = pp.pattern.matcher(text);
            while (matcher.find()) {
                results.add(new DetectionResult(pp.name, matcher.start(), matcher.end()));
            }
        }
        return results;
    }

    /**
     * 텍스트에 개인정보가 포함되어 있는지 여부만 반환합니다.
     */
    public static boolean containsPii(String text) {
        return !detect(text).isEmpty();
    }

    /**
     * 텍스트에서 탐지된 개인정보를 마스킹하여 반환합니다.
     */
    public static String maskAll(String text) {
        if (text == null || text.isBlank()) return text;

        String result = text;
        for (PiiPattern pp : PATTERNS) {
            Matcher matcher = pp.pattern.matcher(result);
            result = matcher.replaceAll(match -> {
                String val = match.group();
                int showLen = Math.min(3, val.length());
                return val.substring(0, showLen) + "*".repeat(val.length() - showLen);
            });
        }
        return result;
    }

    public record DetectionResult(String type, int startIndex, int endIndex) {}

    private record PiiPattern(String name, Pattern pattern) {}
}
