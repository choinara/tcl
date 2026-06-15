package com.peakmate.backend.domain.admin.repository;

import com.peakmate.backend.domain.admin.entity.AdminUserBankAccount;
import org.springframework.lang.NonNull;

/**
 * AdminUserBankAccount Repository 인터페이스.
 */
public interface AdminUserBankAccountRepository {

    /**
     * 계좌 정보 저장
     */
    @NonNull
    AdminUserBankAccount save(@NonNull AdminUserBankAccount adminUserBankAccount);
}
