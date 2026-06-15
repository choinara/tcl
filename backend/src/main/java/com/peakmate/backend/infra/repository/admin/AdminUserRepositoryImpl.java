package com.peakmate.backend.infra.repository.admin;

import com.peakmate.backend.application.admin.dto.query.AdminUserRoleProjection;
import com.peakmate.backend.application.admin.dto.query.AdminUserWithTeamProjection;
import com.peakmate.backend.application.admin.dto.result.AdminUserSearchResultDto;
import com.peakmate.backend.domain.admin.entity.*;
import com.peakmate.backend.domain.admin.repository.AdminUserRepository;
import com.querydsl.core.BooleanBuilder;
import com.querydsl.core.types.Projections;
import com.querydsl.jpa.impl.JPAQueryFactory;
import lombok.RequiredArgsConstructor;
import org.springframework.lang.NonNull;
import org.springframework.stereotype.Repository;
import org.springframework.util.StringUtils;

import java.time.LocalDateTime;
import java.util.*;

@Repository
@RequiredArgsConstructor
public class AdminUserRepositoryImpl implements AdminUserRepository {

    private final AdminUserJpaRepository adminUserJpaRepository;
    private final JPAQueryFactory queryFactory;

    @Override
    public Optional<AdminUser> findByUsername(String username) {
        return adminUserJpaRepository.findByUsername(username);
    }

    @Override
    public Optional<AdminUser> findById(@NonNull Long id) {
        return adminUserJpaRepository.findById(id);
    }

    @Override
    public boolean existsById(@NonNull Long id) {
        return adminUserJpaRepository.existsById(id);
    }

    @Override
    @NonNull
    public AdminUser save(@NonNull AdminUser adminUser) {
        return adminUserJpaRepository.save(adminUser);
    }

    @Override
    public List<AdminUser> findAll(int page, int size) {
        QAdminUser user = QAdminUser.adminUser;
        return queryFactory.selectFrom(user)
                .orderBy(user.createdAt.desc())
                .offset((long) page * size)
                .limit(size)
                .fetch();
    }

    @Override
    public List<AdminUser> findByStatus(AdminUserStatus status) {
        return adminUserJpaRepository.findByStatus(status);
    }

    @Override
    public long count() {
        return adminUserJpaRepository.count();
    }

    @Override
    public long countByStatus(AdminUserStatus status) {
        QAdminUser user = QAdminUser.adminUser;
        Long count = queryFactory.select(user.count())
                .from(user)
                .where(user.status.eq(status))
                .fetchOne();
        return count != null ? count : 0L;
    }

    @Override
    public long countActiveUsers() {
        QAdminUser user = QAdminUser.adminUser;
        QAdminUserSession session = QAdminUserSession.adminUserSession;
        Long count = queryFactory.select(user.count())
                .from(user)
                .join(session).on(user.id.eq(session.adminUserId))
                .where(session.accessTokenExpiresAt.gt(LocalDateTime.now()))
                .fetchOne();
        return count != null ? count : 0L;
    }

    @Override
    public List<AdminUser> findByStatusAndLastActivityAtBefore(AdminUserStatus status, LocalDateTime cutoff) {
        return adminUserJpaRepository.findByStatusAndLastActivityAtBefore(status, cutoff);
    }

    @Override
    public List<AdminUser> saveAll(List<AdminUser> users) {
        return adminUserJpaRepository.saveAll(users);
    }

    @Override
    public AdminUserSearchResultDto searchUsers(String keyword, AdminUserStatus status, boolean pendingOnly, int page, int size) {
        QAdminUser user = QAdminUser.adminUser;
        QTeamInfo team = QTeamInfo.teamInfo;
        QAdminUserRole userRole = QAdminUserRole.adminUserRole;
        QAdminRole role = QAdminRole.adminRole;

        // 동적 조건 생성
        BooleanBuilder condition = new BooleanBuilder();

        // 통합 검색어 (이름, 아이디, 이메일)
        if (StringUtils.hasText(keyword)) {
            condition.and(
                user.name.containsIgnoreCase(keyword)
                    .or(user.username.containsIgnoreCase(keyword))
                    .or(user.email.containsIgnoreCase(keyword))
            );
        }

        // 대기신청 탭 (PENDING 상태만)
        if (pendingOnly) {
            condition.and(user.status.eq(AdminUserStatus.PENDING));
        } else if (status != null) {
            // 상태 필터
            condition.and(user.status.eq(status));
        }

        // 전체 건수 조회
        Long totalElements = queryFactory.select(user.count())
                .from(user)
                .where(condition)
                .fetchOne();
        totalElements = totalElements != null ? totalElements : 0L;

        // 사용자 목록 조회 (팀 정보 포함) - Projections.constructor 사용
        List<AdminUserWithTeamProjection> userRows = queryFactory
                .select(Projections.constructor(
                        AdminUserWithTeamProjection.class,
                        user.id, user.username, user.name, user.email, user.teamId,
                        user.status, user.createdAt, user.lastLoginAt, team.name))
                .from(user)
                .leftJoin(team).on(user.teamId.eq(team.id))
                .where(condition)
                .orderBy(user.createdAt.desc())
                .offset((long) page * size)
                .limit(size)
                .fetch();

        // 사용자별 권한 조회
        List<Long> userIds = userRows.stream()
                .map(AdminUserWithTeamProjection::id)
                .toList();

        Map<Long, List<String>> userRolesMap = new HashMap<>();
        if (!userIds.isEmpty()) {
            List<AdminUserRoleProjection> roleRows = queryFactory
                    .select(Projections.constructor(
                            AdminUserRoleProjection.class,
                            userRole.adminUserId, role.roleCode))
                    .from(userRole)
                    .join(role).on(userRole.adminRoleId.eq(role.id))
                    .where(userRole.adminUserId.in(userIds))
                    .fetch();

            for (AdminUserRoleProjection rp : roleRows) {
                userRolesMap.computeIfAbsent(rp.adminUserId(), k -> new ArrayList<>()).add(rp.roleCode());
            }
        }

        // 결과 변환
        List<AdminUserSearchResultDto.AdminUserSearchItem> items = userRows.stream()
                .map(u -> {
                    List<String> roles = userRolesMap.getOrDefault(u.id(), List.of());
                    return new AdminUserSearchResultDto.AdminUserSearchItem(
                            u.id(),
                            u.username(),
                            u.name(),
                            u.email(),
                            u.teamId(),
                            u.teamName(),
                            u.status(),
                            roles,
                            u.createdAt(),
                            u.lastLoginAt()
                    );
                })
                .toList();

        // 통계 조회
        long totalCount = count();
        long pendingCount = countByStatus(AdminUserStatus.PENDING);
        long activeCount = countActiveUsers();

        return new AdminUserSearchResultDto(
                items,
                totalElements,
                totalCount,
                pendingCount,
                activeCount
        );
    }
}
