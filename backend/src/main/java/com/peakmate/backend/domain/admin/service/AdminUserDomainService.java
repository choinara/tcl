package com.peakmate.backend.domain.admin.service;

import com.peakmate.backend.domain.auth.PasswordEncoder;
import com.peakmate.backend.domain.admin.entity.AdminUser;
import com.peakmate.backend.domain.admin.entity.AdminUserStatus;
import com.peakmate.backend.domain.admin.entity.TeamInfo;
import com.peakmate.backend.domain.admin.repository.AdminUserRepository;
import com.peakmate.backend.global.error.PeakmateErrorCode;
import com.peakmate.core.error.BusinessException;
import com.peakmate.core.error.EntityNotFoundException;
import com.peakmate.backend.application.admin.dto.result.AdminUserSearchResultDto;
import com.peakmate.backend.domain.admin.repository.TeamInfoRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.Optional;

/**
 * 관리자 회원 관련 도메인 로직을 담당하는 서비스.
 */
@Service
@RequiredArgsConstructor
@Slf4j
public class AdminUserDomainService {

    private final AdminUserRepository adminUserRepository;
    private final PasswordEncoder passwordEncoder;
    private final TeamInfoRepository teamInfoRepository;

    /**
     * 관리자 회원가입 처리를 수행합니다.
     */
    @Transactional
    public AdminUser signUp(AdminUser adminUser) {

        // 아이디 중복 체크
        if (adminUserRepository.findByUsername(adminUser.getUsername()).isPresent()) {
            throw new BusinessException(PeakmateErrorCode.DUPLICATE_MEMBER_ID);
        }

        // 비밀번호 암호화 (서비스 계층에서 수행)
        String encodedPassword = passwordEncoder.encode(adminUser.getPassword());
        adminUser.changePassword(encodedPassword);

        // 저장
        return adminUserRepository.save(adminUser);
    }

    /**
     * 아이디 사용 가능 여부를 확인합니다.
     *
     * @param username 확인할 아이디
     * @return 사용 가능하면 true, 중복이면 false
     */
    @Transactional(readOnly = true)
    public boolean isUsernameAvailable(String username) {
        return adminUserRepository.findByUsername(username).isEmpty();
    }

    /**
     * ID로 AdminUser를 조회한다.
     */
    @Transactional(readOnly = true)
    public AdminUser getAdminUserById(Long id) {
        return adminUserRepository.findById(id)
                .orElseThrow(() -> new EntityNotFoundException("관리자를 찾을 수 없습니다. ID: " + id));
    }

    /**
     * 작업자(AdminUser) 존재 여부를 검증한다.
     * 존재하지 않으면 EntityNotFoundException을 던진다.
     */
    @Transactional(readOnly = true)
    public void validateWorkerExists(Long workerId) {
        if (!adminUserRepository.existsById(workerId)) {
            throw new EntityNotFoundException("작업자를 찾을 수 없습니다. ID: " + workerId);
        }
    }

    /**
     * 사용자 검색 (필터링, 페이징)
     *
     * @param keyword 통합 검색어 (이름, 아이디, 이메일)
     * @param status 계정 상태 필터
     * @param pendingOnly 대기신청만 조회 여부
     * @param page 페이지 번호
     * @param size 페이지 크기
     * @return 검색 결과와 통계
     */
    @Transactional(readOnly = true)
    public AdminUserSearchResultDto searchUsers(
            String keyword, AdminUserStatus status, boolean pendingOnly, int page, int size) {
        return adminUserRepository.searchUsers(keyword, status, pendingOnly, page, size);
    }

    /**
     * ID로 AdminUser를 Optional로 조회한다 (null-safe).
     */
    @Transactional(readOnly = true)
    public Optional<AdminUser> findAdminUserById(Long id) {
        if (id == null) return Optional.empty();
        return adminUserRepository.findById(id);
    }

    /**
     * 팀 이름 조회.
     */
    @Transactional(readOnly = true)
    public String findTeamNameById(Long teamId) {
        if (teamId == null) return null;
        return teamInfoRepository.findById(teamId)
                .map(TeamInfo::getName)
                .orElse(null);
    }
}
