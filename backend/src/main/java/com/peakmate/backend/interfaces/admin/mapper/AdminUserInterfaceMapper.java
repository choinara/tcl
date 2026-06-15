package com.peakmate.backend.interfaces.admin.mapper;

import com.peakmate.backend.application.auth.dto.command.SignupCommand;
import com.peakmate.backend.application.auth.dto.query.AdminUserListQuery;
import com.peakmate.backend.application.auth.dto.query.UsernameCheckQuery;
import com.peakmate.backend.application.auth.dto.result.AdminUserListResult;
import com.peakmate.backend.application.auth.dto.result.SignupResult;
import com.peakmate.backend.application.auth.dto.result.UsernameAvailabilityResult;
import com.peakmate.backend.interfaces.admin.dto.request.AdminUserListRequest;
import com.peakmate.backend.interfaces.admin.dto.request.SignupRequest;
import com.peakmate.backend.interfaces.admin.dto.request.UsernameCheckRequest;
import com.peakmate.backend.interfaces.admin.dto.response.AdminUserListResponse;
import com.peakmate.backend.interfaces.admin.dto.response.SignupResponse;
import com.peakmate.backend.interfaces.admin.dto.response.UsernameAvailabilityResponse;
import com.peakmate.backend.global.util.PersonalInfoMasker;
import org.springframework.stereotype.Component;

import java.util.List;

/**
 * 인터페이스 계층에서 데이터 변환을 담당하는 매퍼 클래스.
 */
@Component
public class AdminUserInterfaceMapper {

    /**
     * SignupRequest를 SignupCommand로 변환합니다.
     */
    public SignupCommand toSignupCommand(SignupRequest request) {
        return new SignupCommand(
                new SignupCommand.AdminUserInfoCommand(
                        request.adminUser().username(),
                        request.adminUser().password(),
                        request.adminUser().passwordConfirm(),
                        request.adminUser().name(),
                        request.adminUser().email(),
                        request.adminUser().phoneNumber(),
                        request.adminUser().birthday(),
                        request.adminUser().postalCode(),
                        request.adminUser().addressBase(),
                        request.adminUser().addressDetail()),
                new SignupCommand.BankAccountCommand(
                        request.bankAccount().bankCode(),
                        request.bankAccount().accountNumber(),
                        request.bankAccount().accountHolder()));
    }

    /**
     * SignupResult를 SignupResponse로 변환합니다.
     */
    public SignupResponse toSignupResponse(SignupResult result) {
        return new SignupResponse(result.id(), result.username());
    }

    /**
     * UsernameCheckRequest를 UsernameCheckQuery로 변환합니다.
     */
    public UsernameCheckQuery toUsernameCheckQuery(UsernameCheckRequest request) {
        return new UsernameCheckQuery(request.username());
    }

    /**
     * UsernameAvailabilityResult를 UsernameAvailabilityResponse로 변환합니다.
     */
    public UsernameAvailabilityResponse toUsernameAvailabilityResponse(UsernameAvailabilityResult result) {
        String message = result.available()
                ? "사용 가능한 아이디입니다"
                : "이미 사용 중인 아이디입니다";
        return new UsernameAvailabilityResponse(result.username(), result.available(), message);
    }


    /**
     * AdminUserListRequest를 AdminUserListQuery로 변환합니다.
     */
    public AdminUserListQuery toAdminUserListQuery(AdminUserListRequest request) {
        return AdminUserListQuery.of(
                request.keyword(),
                request.status(),
                request.pendingOnly(),
                request.page(),
                request.size()
        );
    }

    /**
     * AdminUserListResult를 AdminUserListResponse로 변환합니다.
     * @param accessLevel PII 접근 등급에 따라 이름/이메일 마스킹 적용
     * @param currentUsername 현재 요청자 username (isSelf 판단용)
     */
    public AdminUserListResponse toAdminUserListResponse(AdminUserListResult result,
                                                         PersonalInfoMasker.AccessLevel accessLevel,
                                                         String currentUsername) {

        List<AdminUserListResponse.AdminUserItem> users = result.users().stream()
                .map(u -> {
                    boolean isSelf = u.username().equals(currentUsername);
                    PersonalInfoMasker.AccessLevel effectiveLevel =
                            isSelf ? PersonalInfoMasker.AccessLevel.FULL : accessLevel;
                    return new AdminUserListResponse.AdminUserItem(
                            u.id(),
                            u.username(),
                            PersonalInfoMasker.maskName(u.name(), effectiveLevel),
                            PersonalInfoMasker.maskEmail(u.email(), effectiveLevel),
                            u.teamName(),
                            u.roles() != null ? u.roles() : List.of(),
                            u.status() != null ? u.status().name() : null,
                            u.status() != null ? u.status().getDescription() : null,
                            u.lastLoginAt()
                    );
                })
                .toList();

        AdminUserListResponse.Statistics statistics = new AdminUserListResponse.Statistics(
                result.statistics().totalCount(),
                result.statistics().pendingCount(),
                result.statistics().activeCount()
        );

        AdminUserListResponse.PagingInfo paging = new AdminUserListResponse.PagingInfo(
                result.paging().page(),
                result.paging().size(),
                result.paging().totalElements(),
                result.paging().totalPages(),
                result.paging().hasNext(),
                result.paging().hasPrevious()
        );

        return new AdminUserListResponse(users, statistics, paging);
    }
}
