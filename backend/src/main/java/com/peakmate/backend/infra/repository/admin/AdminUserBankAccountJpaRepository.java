package com.peakmate.backend.infra.repository.admin;

import com.peakmate.backend.domain.admin.entity.AdminUserBankAccount;
import org.springframework.data.jpa.repository.JpaRepository;

public interface AdminUserBankAccountJpaRepository extends JpaRepository<AdminUserBankAccount, Long> {
}
