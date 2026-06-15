package com.peakmate.backend.interfaces.admin.dto.request;

import com.peakmate.backend.domain.admin.entity.BankCode;
import jakarta.validation.Valid;
import jakarta.validation.constraints.*;

import java.time.LocalDate;

/**
 * 회원가입 요청 DTO.
 */
public record SignupRequest(
        @NotNull(message = "관리자 정보는 필수입니다")
        @Valid AdminUserInfoRequest adminUser,

        @NotNull(message = "계좌 정보는 필수입니다")
        @Valid BankAccountRequest bankAccount
) {

    public record AdminUserInfoRequest(
            @NotBlank(message = "아이디는 필수입니다")
            @Size(min = 4, max = 20, message = "아이디는 4~20자여야 합니다")
            @Pattern(regexp = "^[a-zA-Z0-9_-]+$", message = "아이디는 영문, 숫자, _, - 만 사용 가능합니다")
            String username,

            @NotBlank(message = "비밀번호는 필수입니다")
            @Size(min = 8, max = 20, message = "비밀번호는 8~20자여야 합니다")
            @Pattern(regexp = "^(?=.*[A-Za-z])(?=.*\\d)(?=.*[@$!%*#?&])[A-Za-z\\d@$!%*#?&]+$", message = "비밀번호는 영문, 숫자, 특수문자를 포함해야 합니다")
            String password,

            @NotBlank(message = "비밀번호 확인은 필수입니다")
            String passwordConfirm,

            @NotBlank(message = "이름은 필수입니다")
            @Size(max = 50, message = "이름은 50자를 초과할 수 없습니다")
            String name,

            @NotBlank(message = "이메일은 필수입니다")
            @Email(message = "올바른 이메일 형식이 아닙니다")
            String email,

            @NotBlank(message = "연락처는 필수입니다")
            @Pattern(regexp = "^01[0-9]-?[0-9]{3,4}-?[0-9]{4}$", message = "올바른 연락처 형식이 아닙니다")
            String phoneNumber,

            @NotNull(message = "생년월일은 필수입니다")
            @Past(message = "생년월일은 과거 날짜여야 합니다")
            LocalDate birthday,

            @NotBlank(message = "우편번호는 필수입니다")
            @Pattern(regexp = "^\\d{5}$", message = "우편번호는 5자리 숫자여야 합니다")
            String postalCode,

            @NotBlank(message = "기본주소는 필수입니다")
            String addressBase,

            @Size(max = 255, message = "상세주소는 255자를 초과할 수 없습니다")
            String addressDetail
    ) {
    }

    public record BankAccountRequest(
            @NotNull(message = "거래은행은 필수입니다")
            BankCode bankCode,

            @NotBlank(message = "계좌번호는 필수입니다")
            @Pattern(regexp = "^\\d{10,14}$", message = "계좌번호는 10~14자리 숫자여야 합니다")
            String accountNumber,

            @NotBlank(message = "예금주는 필수입니다")
            @Size(max = 50, message = "예금주는 50자를 초과할 수 없습니다")
            String accountHolder
    ) {
    }
}
