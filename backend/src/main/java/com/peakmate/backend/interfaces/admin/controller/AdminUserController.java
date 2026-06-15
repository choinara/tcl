package com.peakmate.backend.interfaces.admin.controller;

import com.peakmate.backend.application.auth.dto.command.SignupCommand;
import com.peakmate.backend.application.auth.dto.query.AdminUserListQuery;
import com.peakmate.backend.application.auth.dto.result.AdminUserListResult;
import com.peakmate.backend.application.auth.dto.result.SignupResult;
import com.peakmate.backend.application.auth.dto.query.UsernameCheckQuery;
import com.peakmate.backend.application.auth.dto.result.UsernameAvailabilityResult;
import com.peakmate.backend.application.admin.facade.AdminUserFacade;
import com.peakmate.backend.domain.admin.entity.AdminUser;
import com.peakmate.backend.global.util.PersonalInfoMasker;
import com.peakmate.backend.interfaces.admin.dto.request.AdminUserListRequest;
import com.peakmate.backend.interfaces.admin.dto.request.SignupRequest;
import com.peakmate.backend.interfaces.admin.dto.request.UsernameCheckRequest;
import com.peakmate.backend.interfaces.admin.dto.response.AdminUserListResponse;
import com.peakmate.backend.interfaces.admin.dto.response.SignupResponse;
import com.peakmate.backend.interfaces.admin.dto.response.UsernameAvailabilityResponse;
import com.peakmate.core.common.ApiResponse;
import com.peakmate.core.security.annotation.RequirePermission;
import com.peakmate.backend.interfaces.admin.mapper.AdminUserInterfaceMapper;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

/**
 * 관리자 회원 관련 API를 담당하는 컨트롤러.
 */
@RestController
@RequestMapping("/api/admin/users")
@RequiredArgsConstructor
public class AdminUserController {

    private final AdminUserFacade adminUserFacade;
    private final AdminUserInterfaceMapper adminUserInterfaceMapper;

    /**
     * 관리자 회원가입
     */
    @RequirePermission(menu = "UM0010", action = "create")
    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public ApiResponse<SignupResponse> signUp(@Valid @RequestBody SignupRequest signupRequest) {
        SignupCommand command = adminUserInterfaceMapper.toSignupCommand(signupRequest);
        SignupResult result = adminUserFacade.signUp(command);
        return ApiResponse.success(adminUserInterfaceMapper.toSignupResponse(result));
    }

    /**
     * 아이디(Username) 중복 확인
     */
    @GetMapping("/exists")
    public ApiResponse<UsernameAvailabilityResponse> checkUsernameAvailability(
            @Valid UsernameCheckRequest request) {

        UsernameCheckQuery query = adminUserInterfaceMapper.toUsernameCheckQuery(request);
        UsernameAvailabilityResult result = adminUserFacade.checkUsernameAvailability(query);
        return ApiResponse.success(adminUserInterfaceMapper.toUsernameAvailabilityResponse(result));
    }


    /**
     * 관리자 사용자 목록 조회
     * - 통합 검색 (이름, 아이디, 이메일)
     * - 계정 상태 필터
     * - 대기신청 탭 (pendingOnly=true)
     */
    @RequirePermission(menu = "UM0010", action = "read")
    @GetMapping
    public ApiResponse<AdminUserListResponse> getUserList(@Valid AdminUserListRequest request) {
        String currentUsername = getCurrentUsername();

        AdminUserListQuery query = adminUserInterfaceMapper.toAdminUserListQuery(request);
        AdminUserListResult result = adminUserFacade.searchUsers(query);
        return ApiResponse.success(
                adminUserInterfaceMapper.toAdminUserListResponse(result, PersonalInfoMasker.AccessLevel.PARTIAL, currentUsername));
    }

    private String getCurrentUsername() {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        return auth != null ? auth.getName() : "UNKNOWN";
    }
}
