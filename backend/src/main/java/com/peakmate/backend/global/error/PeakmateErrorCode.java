package com.peakmate.backend.global.error;

import com.peakmate.core.error.ErrorCodeProvider;
import lombok.AllArgsConstructor;
import lombok.Getter;

/**
 * PeakMate 프로젝트 전용 에러 코드.
 * 공통 에러 코드는 com.peakmate.core.error.CommonErrorCode 사용.
 */
@Getter
@AllArgsConstructor
public enum PeakmateErrorCode implements ErrorCodeProvider {

    // Member
    MEMBER_NOT_FOUND(404, "M001", "Member Not Found"),
    EMAIL_DUPLICATION(400, "M002", "Email is Duplicated"),
    LOGIN_INPUT_INVALID(400, "M003", "Login Input is Invalid"),
    DUPLICATE_MEMBER_ID(400, "M004", "Member ID is Duplicated"),

    // Auth (peakmate 전용)
    PASSWORD_MISMATCH(400, "A004", "비밀번호가 일치하지 않습니다"),
    ACCOUNT_LOCKED(423, "A005", "계정이 잠겨있습니다"),
    PASSWORD_EXPIRED(403, "A006", "비밀번호 변경이 필요합니다"),
    PASSWORD_POLICY_VIOLATION(400, "A007", "비밀번호 정책에 위반됩니다"),

    // Business
    INVALID_STATE(409, "B001", "Invalid State"),

    // File
    FILE_UPLOAD_FAILED(500, "F001", "파일 업로드에 실패했습니다");

    private final int status;
    private final String code;
    private final String message;
}
