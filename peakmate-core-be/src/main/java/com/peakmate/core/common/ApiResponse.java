package com.peakmate.core.common;

import com.fasterxml.jackson.annotation.JsonInclude;
import lombok.AccessLevel;
import lombok.AllArgsConstructor;
import lombok.Getter;

/**
 * API 공통 응답 래퍼
 *
 * @param <T> 응답 데이터 타입
 */
@Getter
@AllArgsConstructor(access = AccessLevel.PRIVATE)
@JsonInclude(JsonInclude.Include.NON_NULL)
public class ApiResponse<T> {

    private final boolean success;
    private final T data;
    private final String message;
    private final ErrorInfo error;

    /**
     * 성공 응답 (데이터 포함)
     */
    public static <T> ApiResponse<T> success(T data) {
        return new ApiResponse<>(true, data, null, null);
    }

    /**
     * 성공 응답 (데이터 + 메시지)
     */
    public static <T> ApiResponse<T> success(T data, String message) {
        return new ApiResponse<>(true, data, message, null);
    }

    /**
     * 성공 응답 (메시지만)
     */
    public static ApiResponse<Void> success(String message) {
        return new ApiResponse<>(true, null, message, null);
    }

    /**
     * 성공 응답 (데이터 없음)
     */
    public static ApiResponse<Void> success() {
        return new ApiResponse<>(true, null, null, null);
    }

    /**
     * 실패 응답
     */
    public static <T> ApiResponse<T> error(String code, String message) {
        return new ApiResponse<>(false, null, null, new ErrorInfo(code, message));
    }

    /**
     * 실패 응답 (상세 정보 포함)
     */
    public static <T> ApiResponse<T> error(String code, String message, String detail) {
        return new ApiResponse<>(false, null, null, new ErrorInfo(code, message, detail));
    }

    /**
     * 에러 정보
     */
    @Getter
    @AllArgsConstructor
    public static class ErrorInfo {
        private final String code;
        private final String message;
        private final String detail;

        public ErrorInfo(String code, String message) {
            this(code, message, null);
        }
    }
}
