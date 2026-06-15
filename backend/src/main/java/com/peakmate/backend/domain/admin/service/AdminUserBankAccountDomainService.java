package com.peakmate.backend.domain.admin.service;

import com.peakmate.backend.domain.admin.entity.AdminUserBankAccount;
import com.peakmate.backend.domain.admin.entity.BankCode;
import com.peakmate.backend.domain.admin.repository.AdminUserBankAccountRepository;
import com.peakmate.core.error.CommonErrorCode;
import com.peakmate.core.error.BusinessException;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

/**
 * 관리자 계좌 관련 도메인 로직을 담당하는 서비스.
 */
@Service
@RequiredArgsConstructor
public class AdminUserBankAccountDomainService {

    private final AdminUserBankAccountRepository adminUserBankAccountRepository;

    /**
     * 사용자의 계좌 정보를 등록합니다.
     */
    @Transactional
    public void registerBankAccount(Long userId, BankCode bankCode, String accountNumber, String accountHolder) {
        if (bankCode == null || accountNumber == null || accountNumber.isBlank()
                || accountHolder == null || accountHolder.isBlank()) {
            throw new BusinessException(CommonErrorCode.INVALID_INPUT_VALUE);
        }

        AdminUserBankAccount bankAccount = AdminUserBankAccount.of(
                userId,
                bankCode,
                accountNumber,
                accountHolder);

        adminUserBankAccountRepository.save(bankAccount);
    }
}
