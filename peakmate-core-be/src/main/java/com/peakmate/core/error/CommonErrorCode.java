package com.peakmate.core.error;

import lombok.AllArgsConstructor;
import lombok.Getter;

/**
 * 프로젝트 공통 에러 코드.
 * 모든 Spring Boot 프로젝트에서 재사용 가능한 범용 에러 코드.
 */
@Getter
@AllArgsConstructor
public enum CommonErrorCode implements ErrorCodeProvider {

    // Common
    INTERNAL_SERVER_ERROR(500, "C001", "Internal Server Error"),
    INVALID_INPUT_VALUE(400, "C002", "Invalid Input Value"),
    METHOD_NOT_ALLOWED(405, "C003", "Method Not Allowed"),
    HANDLE_ACCESS_DENIED(403, "C004", "Access is Denied"),
    URL_NOT_FOUND(404, "C005", "URL Not Found"),
    ENTITY_NOT_FOUND(404, "C006", "Entity Not Found"),

    // Auth (공통)
    INVALID_TOKEN(401, "A001", "Invalid Token"),
    EXPIRED_TOKEN(401, "A002", "Expired Token"),
    INVALID_PASSWORD(401, "A003", "Invalid Password"),
    FORBIDDEN(403, "A008", "접근이 거부되었습니다");

    private final int status;
    private final String code;
    private final String message;
}
