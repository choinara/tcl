package com.peakmate.backend.domain.admin.entity;

import com.peakmate.core.audit.AuditableEntity;
import com.peakmate.backend.global.util.EncryptedStringConverter;
import jakarta.persistence.*;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import lombok.Getter;
import lombok.Setter;
import org.springframework.lang.NonNull;

@Getter
@Entity
@Table(name = "admin_user_bank_account")
public class AdminUserBankAccount extends AuditableEntity {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "seq_id", nullable = false)
    private Long id;

    @Column(name = "admin_user_id")
    private Long adminUserId;

    @Convert(converter = BankCodeConverter.class)
    @Column(name = "bank_code", length = 10, nullable = false)
    private BankCode bankCode;

    @Size(max = 100)
    @Column(name = "bank_name", length = 100)
    private String bankName;

    @Size(max = 200)
    @Column(name = "account_number", length = 200)
    @Convert(converter = EncryptedStringConverter.class)
    private String accountNumber;

    @Size(max = 300)
    @Column(name = "account_holder", length = 300)
    @Convert(converter = EncryptedStringConverter.class)
    private String accountHolder;

    /**
     * AdminUserBankAccount 생성을 위한 정적 팩토리 메서드
     */
    public static AdminUserBankAccount of(Long adminUserId, BankCode bankCode, String accountNumber,
            String accountHolder) {
        AdminUserBankAccount bankAccount = new AdminUserBankAccount();
        bankAccount.adminUserId = adminUserId;
        bankAccount.bankCode = bankCode;
        bankAccount.bankName = bankCode.getName();
        bankAccount.accountNumber = accountNumber;
        bankAccount.accountHolder = accountHolder;
        return bankAccount;
    }
}