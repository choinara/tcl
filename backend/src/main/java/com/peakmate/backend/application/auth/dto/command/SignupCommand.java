package com.peakmate.backend.application.auth.dto.command;

import com.peakmate.backend.domain.admin.entity.BankCode;

import java.time.LocalDate;

/**
 * 회원가입 유스케이스를 위한 명령형 DTO.
 * teamId, contractStatus, roleCodes는 관리자가 나중에 설정합니다.
 */
public record SignupCommand(
        AdminUserInfoCommand adminUser,
        BankAccountCommand bankAccount
) {
    public record AdminUserInfoCommand(
            String username,
            String password,
            String passwordConfirm,
            String name,
            String email,
            String phoneNumber,
            LocalDate birthday,
            String postalCode,
            String addressBase,
            String addressDetail
    ) {
    }

    public record BankAccountCommand(
            BankCode bankCode,
            String accountNumber,
            String accountHolder
    ) {
    }
}