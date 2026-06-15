package com.peakmate.backend.application.auth.mapper;

import com.peakmate.backend.application.auth.dto.command.SignupCommand;
import com.peakmate.backend.application.auth.dto.result.AdminUserListResult;
import com.peakmate.backend.application.auth.dto.result.SignupResult;
import com.peakmate.backend.application.admin.dto.result.AdminUserSearchResultDto;
import com.peakmate.backend.domain.admin.entity.AdminUser;
import org.springframework.stereotype.Component;

import java.util.List;
import java.util.stream.Collectors;

/**
 * 애플리케이션 계층에서 데이터 변환을 담당하는 매퍼 클래스.
 */
@Component
public class AdminUserApplicationMapper {

    /**
     * AdminUserInfoCommand를 AdminUser 엔티티로 변환합니다.
     */
    public AdminUser toEntity(SignupCommand.AdminUserInfoCommand command) {
        return AdminUser.signUp(
                command.username(),
                command.password(),
                command.name(),
                command.email(),
                command.phoneNumber(),
                command.birthday(),
                command.postalCode(),
                command.addressBase(),
                command.addressDetail());
    }

    /**
     * AdminUser 엔티티를 SignupResult로 변환합니다.
     */
    public SignupResult toSignupResult(AdminUser adminUser) {
        return new SignupResult(adminUser.getId(), adminUser.getUsername());
    }

    /**
     * Domain 검색 결과를 Application Result로 변환합니다.
     *
     * @param dto Domain Layer의 검색 결과 DTO
     * @param page 페이지 번호
     * @param size 페이지 크기
     * @return Application Layer의 Result DTO
     */
    public AdminUserListResult toAdminUserListResult(
            AdminUserSearchResultDto dto,
            int page,
            int size) {

        List<AdminUserListResult.AdminUserInfo> users = dto.users().stream()
                .map(u -> new AdminUserListResult.AdminUserInfo(
                        u.id(),
                        u.username(),
                        u.name(),
                        u.email(),
                        u.teamId(),
                        u.teamName(),
                        u.status(),
                        u.roles(),
                        u.createdAt(),
                        u.lastLoginAt()))
                .collect(Collectors.toList());

        AdminUserListResult.Statistics stats = new AdminUserListResult.Statistics(
                dto.totalCount(),
                dto.pendingCount(),
                dto.activeCount());

        int totalPages = size > 0 ? (int) Math.ceil((double) dto.totalElements() / size) : 0;
        AdminUserListResult.PagingMetadata paging = new AdminUserListResult.PagingMetadata(
                page,
                size,
                dto.totalElements(),
                totalPages,
                page < totalPages - 1,
                page > 0);

        return new AdminUserListResult(users, stats, paging);
    }
}
