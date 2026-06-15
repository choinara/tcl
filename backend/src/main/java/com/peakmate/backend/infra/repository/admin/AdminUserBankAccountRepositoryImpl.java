package com.peakmate.backend.infra.repository.admin;

import com.peakmate.backend.domain.admin.entity.AdminUserBankAccount;
import com.peakmate.backend.domain.admin.repository.AdminUserBankAccountRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.lang.NonNull;
import org.springframework.stereotype.Repository;

@Repository
@RequiredArgsConstructor
public class AdminUserBankAccountRepositoryImpl implements AdminUserBankAccountRepository {

    private final AdminUserBankAccountJpaRepository adminUserBankAccountJpaRepository;

    @Override
    @NonNull
    public AdminUserBankAccount save(@NonNull AdminUserBankAccount adminUserBankAccount) {
        return adminUserBankAccountJpaRepository.save(adminUserBankAccount);
    }
}
