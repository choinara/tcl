package com.peakmate.backend.application.admin.facade;

import com.peakmate.backend.application.auth.dto.command.SignupCommand;
import com.peakmate.backend.application.auth.dto.query.AdminUserListQuery;
import com.peakmate.backend.application.auth.dto.query.UsernameCheckQuery;
import com.peakmate.backend.application.auth.dto.result.AdminUserListResult;
import com.peakmate.backend.application.auth.dto.result.SignupResult;
import com.peakmate.backend.application.auth.dto.result.UsernameAvailabilityResult;
import com.peakmate.backend.application.auth.mapper.AdminUserApplicationMapper;
import com.peakmate.backend.application.admin.dto.result.AdminUserSearchResultDto;
import com.peakmate.backend.domain.admin.entity.AdminUser;
import com.peakmate.backend.domain.admin.service.AdminUserBankAccountDomainService;
import com.peakmate.backend.domain.admin.service.AdminUserDomainService;
import com.peakmate.backend.domain.admin.service.AdminUserRoleDomainService;
import com.peakmate.backend.global.error.PeakmateErrorCode;
import com.peakmate.core.error.BusinessException;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

/**
 * 관리자 회원 관련 유스케이스를 조정하는 Facade 클래스.
 */
@Component
@RequiredArgsConstructor
public class AdminUserFacade {

    // Domain Service만 의존 (Repository 직접 참조 제거)
    private final AdminUserDomainService adminUserDomainService;
    private final AdminUserRoleDomainService adminUserRoleDomainService;
    private final AdminUserBankAccountDomainService adminUserBankAccountDomainService;
    private final AdminUserApplicationMapper adminUserApplicationMapper;

    /**
     * 관리자 회원가입 유스케이스 (오케스트레이션)
     * 회원가입 시 status = PENDING, teamId/roleCodes는 관리자가 나중에 설정
     */
    @Transactional
    public SignupResult signUp(SignupCommand command) {
        // 0. 비밀번호 확인 검증
        if (!command.adminUser().password().equals(command.adminUser().passwordConfirm())) {
            throw new BusinessException(PeakmateErrorCode.PASSWORD_MISMATCH);
        }

        // 1. 사용자 생성 및 저장 (status = PENDING 기본값)
        AdminUser adminUser = adminUserApplicationMapper.toEntity(command.adminUser());
        AdminUser savedUser = adminUserDomainService.signUp(adminUser);

        // 2. 계좌 정보 등록
        adminUserBankAccountDomainService.registerBankAccount(
                savedUser.getId(),
                command.bankAccount().bankCode(),
                command.bankAccount().accountNumber(),
                command.bankAccount().accountHolder());

        // Note: teamId, roleCodes는 관리자가 승인 시 설정

        return adminUserApplicationMapper.toSignupResult(savedUser);
    }

    /**
     * 아이디 사용 가능 여부 확인
     */
    @Transactional(readOnly = true)
    public UsernameAvailabilityResult checkUsernameAvailability(UsernameCheckQuery query) {
        boolean available = adminUserDomainService.isUsernameAvailable(query.username());
        return new UsernameAvailabilityResult(query.username(), available);
    }

    /**
     * 사용자 검색 (필터링, 페이징)
     */
    @Transactional(readOnly = true)
    public AdminUserListResult searchUsers(AdminUserListQuery query) {
        // Domain Service를 통해 검색
        AdminUserSearchResultDto searchResult = adminUserDomainService.searchUsers(
                query.keyword(),
                query.status(),
                query.pendingOnly(),
                query.page(),
                query.size()
        );

        // Mapper를 통해 Result DTO로 변환
        return adminUserApplicationMapper.toAdminUserListResult(searchResult, query.page(), query.size());
    }
}
