package com.peakmate.backend.interfaces.system.controller;

import com.peakmate.backend.domain.admin.entity.AdminRole;
import com.peakmate.backend.domain.admin.entity.AdminUser;
import com.peakmate.backend.domain.admin.entity.AdminUserRole;
import com.peakmate.backend.domain.admin.repository.AdminUserRepository;
import com.peakmate.backend.domain.admin.repository.AdminUserRoleRepository;
import com.peakmate.backend.domain.menu.entity.SystemMenu;
import com.peakmate.backend.domain.menu.service.MenuDomainService;
import com.peakmate.core.common.ApiResponse;
import com.peakmate.backend.infra.repository.admin.AdminRoleJpaRepository;
import com.peakmate.backend.infra.repository.admin.AdminUserJpaRepository;
import com.peakmate.backend.infra.repository.admin.AdminUserRoleJpaRepository;
import com.peakmate.backend.infra.repository.menu.SystemMenuJpaRepository;
import com.peakmate.backend.domain.auth.service.PiiAuditService;
import com.peakmate.backend.domain.auth.service.PasswordPolicyService;
import com.peakmate.backend.infra.mail.MailService;
import com.peakmate.backend.interfaces.system.dto.request.CreateUserRequest;
import com.peakmate.backend.interfaces.system.dto.request.UpdateUserRequest;
import com.peakmate.core.log.SystemLog;
import com.peakmate.core.security.annotation.RequirePermission;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.web.bind.annotation.*;

import com.peakmate.backend.global.util.PersonalInfoMasker;

import java.security.SecureRandom;
import java.util.*;
import java.util.stream.Collectors;

/**
 * 시스템 사용자 관리 CRUD API Controller.
 */
@Slf4j
@io.swagger.v3.oas.annotations.tags.Tag(name = "사용자 관리", description = "사용자 CRUD + 상태 관리 API")
@RestController
@RequestMapping("/api/system/users")
@RequiredArgsConstructor
public class SystemUserController {

    private final AdminUserJpaRepository adminUserJpaRepository;
    private final AdminUserRoleRepository adminUserRoleRepository;
    private final AdminUserRoleJpaRepository adminUserRoleJpaRepository;
    private final AdminRoleJpaRepository adminRoleJpaRepository;
    private final PasswordEncoder passwordEncoder;
    private final PasswordPolicyService passwordPolicyService;
    private final MailService mailService;
    private final PiiAuditService piiAuditService;
    private final MenuDomainService menuDomainService;
    private final SystemMenuJpaRepository systemMenuJpaRepository;

    /**
     * 사용자 목록 (페이징)
     * PeakDataGrid에서 호출: ?page=0&size=50&search=keyword
     */
    @RequirePermission(menu = "UM0010", action = "read")
    @GetMapping
    public ApiResponse<Map<String, Object>> listUsers(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "50") int size,
            @RequestParam(required = false) String search,
            HttpServletRequest httpRequest) {

        String currentUsername = getCurrentUsername();

        Page<AdminUser> result = adminUserJpaRepository.findAll(
                PageRequest.of(page, size, Sort.by("id").ascending()));

        List<Map<String, Object>> content = result.getContent().stream()
                .map(user -> toUserMap(user, currentUsername))
                .collect(Collectors.toList());

        // search filter (in-memory for now, since AdminUserJpaRepository doesn't have search)
        if (search != null && !search.isBlank()) {
            String keyword = search.toLowerCase();
            content = content.stream()
                    .filter(u -> {
                        String username = String.valueOf(u.getOrDefault("username", "")).toLowerCase();
                        String name = String.valueOf(u.getOrDefault("name", "")).toLowerCase();
                        return username.contains(keyword) || name.contains(keyword);
                    })
                    .collect(Collectors.toList());
        }

        Map<String, Object> response = new LinkedHashMap<>();
        response.put("content", content);
        response.put("totalElements", result.getTotalElements());
        response.put("totalPages", result.getTotalPages());

        return ApiResponse.success(response);
    }

    /**
     * 사용자 등록
     */
    @RequirePermission(menu = "UM0010", action = "create")
    @SystemLog(type = "USER_CREATE", action = "사용자 생성")
    @PostMapping
    @org.springframework.transaction.annotation.Transactional
    public ApiResponse<Map<String, Object>> createUser(@Valid @RequestBody CreateUserRequest request) {
        if (adminUserJpaRepository.findByUsername(request.username()).isPresent()) {
            return ApiResponse.error("USER002", "이미 존재하는 사용자ID입니다.");
        }

        String encodedPassword = passwordEncoder.encode(request.password());
        String email = request.email() != null ? request.email() : "";
        AdminUser user = AdminUser.create(request.username(), encodedPassword, request.name(), email, null);
        AdminUser saved = adminUserJpaRepository.save(user);

        // 역할 저장
        if (request.roles() != null && !request.roles().isEmpty()) {
            List<AdminRole> roles = adminRoleJpaRepository.findAllByRoleCodeIn(request.roles());
            for (AdminRole role : roles) {
                adminUserRoleJpaRepository.save(AdminUserRole.of(saved.getId(), role.getId()));
            }
        }

        return ApiResponse.success(toUserMap(saved, getCurrentUsername()));
    }

    /**
     * 사용자 수정
     */
    @RequirePermission(menu = "UM0010", action = "update")
    @SystemLog(type = "USER_UPDATE", action = "사용자 수정")
    @PutMapping("/{id}")
    @org.springframework.transaction.annotation.Transactional
    public ApiResponse<Map<String, Object>> updateUser(@PathVariable Long id,
                                                          @Valid @RequestBody UpdateUserRequest request,
                                                          HttpServletRequest httpRequest) {
        AdminUser user = adminUserJpaRepository.findById(id).orElse(null);
        if (user == null) {
            return ApiResponse.error("USER003", "사용자를 찾을 수 없습니다.");
        }

        if (request.name() != null) {
            user.updateName(request.name());
            piiAuditService.logModify("admin_user", id, "name", getCurrentUsername(), httpRequest.getRemoteAddr());
        }
        if (request.email() != null) {
            user.updateEmail(request.email());
            piiAuditService.logModify("admin_user", id, "email", getCurrentUsername(), httpRequest.getRemoteAddr());
        }
        if (request.password() != null && !request.password().isBlank()) {
            user.changePassword(passwordEncoder.encode(request.password()));
        }

        // 역할 변경
        if (request.roles() != null) {
            adminUserRoleJpaRepository.deleteByAdminUserId(id);
            adminUserRoleJpaRepository.flush();
            if (!request.roles().isEmpty()) {
                List<AdminRole> roles = adminRoleJpaRepository.findAllByRoleCodeIn(request.roles());
                for (AdminRole role : roles) {
                    adminUserRoleJpaRepository.save(AdminUserRole.of(id, role.getId()));
                }
            }
        }

        AdminUser saved = adminUserJpaRepository.save(user);

        return ApiResponse.success(toUserMap(saved, getCurrentUsername()));
    }

    /**
     * 사용자 상태 토글 (ACTIVE ↔ INACTIVE)
     */
    @RequirePermission(menu = "UM0010", action = "update")
    @SystemLog(type = "USER_UPDATE", action = "사용자 상태변경")
    @PatchMapping("/{id}/toggle")
    @org.springframework.transaction.annotation.Transactional
    public ApiResponse<Map<String, Object>> toggleStatus(@PathVariable Long id) {
        AdminUser user = adminUserJpaRepository.findById(id).orElse(null);
        if (user == null) {
            return ApiResponse.error("USER003", "사용자를 찾을 수 없습니다.");
        }
        user.toggleStatus();
        AdminUser saved = adminUserJpaRepository.save(user);

        return ApiResponse.success(toUserMap(saved, getCurrentUsername()));
    }

    /**
     * 사용자 삭제 (비활성화 처리)
     */
    @RequirePermission(menu = "UM0010", action = "delete")
    @SystemLog(type = "USER_DELETE", action = "사용자 삭제")
    @DeleteMapping("/{id}")
    @org.springframework.transaction.annotation.Transactional
    public ApiResponse<Void> deleteUser(@PathVariable Long id) {
        AdminUser user = adminUserJpaRepository.findById(id).orElse(null);
        if (user == null) {
            return ApiResponse.error("USER003", "사용자를 찾을 수 없습니다.");
        }
        user.deactivate();
        adminUserJpaRepository.save(user);

        return ApiResponse.success("사용자가 비활성화되었습니다.");
    }

    /**
     * 개별 사용자 PII 열람 (canViewPii 권한 필요).
     * 평문 PII를 반환하며 VIEW 감사 로그를 기록한다.
     */
    @RequirePermission(menu = "UM0010", action = "viewPii")
    @GetMapping("/{id}/pii")
    public ApiResponse<Map<String, Object>> getUserPii(@PathVariable Long id, HttpServletRequest request) {
        AdminUser user = adminUserJpaRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("사용자를 찾을 수 없습니다"));
        String currentUsername = getCurrentUsername();
        piiAuditService.logView("admin_user", id, currentUsername, request.getRemoteAddr());

        Map<String, Object> data = new LinkedHashMap<>();
        data.put("id", user.getId());
        data.put("name", user.getName());
        data.put("email", user.getEmail());
        data.put("phoneNumber", user.getPhoneNumber());
        data.put("birthday", user.getBirthday());
        data.put("postalCode", user.getPostalCode());
        data.put("addressBase", user.getAddressBase());
        data.put("addressDetail", user.getAddressDetail());
        return ApiResponse.success(data);
    }

    /**
     * 비밀번호 초기화 (관리자용)
     * 임시 비밀번호 자동 생성 → PBKDF2 암호화 → DB 저장 → mustChangePassword 설정 → 이력 기록
     */
    @RequirePermission(menu = "UM0010", action = "update")
    @SystemLog(type = "PASSWORD_RESET", action = "비밀번호 초기화")
    @PutMapping("/{id}/reset-password")
    @org.springframework.transaction.annotation.Transactional
    public ApiResponse<Map<String, Object>> resetPassword(@PathVariable Long id) {
        AdminUser user = adminUserJpaRepository.findById(id).orElse(null);
        if (user == null) {
            return ApiResponse.error("USER003", "사용자를 찾을 수 없습니다.");
        }

        // 1. 임시 비밀번호 자동 생성
        String tempPassword = generateTempPassword();

        // 2. PBKDF2로 암호화
        String encodedPassword = passwordEncoder.encode(tempPassword);

        // 3. DB 저장 + mustChangePassword = true
        user.changePasswordWithPolicy(encodedPassword);
        user.forcePasswordChange();
        adminUserJpaRepository.save(user);

        // 4. 비밀번호 이력에 기록
        passwordPolicyService.recordPasswordChange(user.getId(), encodedPassword);

        // 5. 이메일 발송 또는 임시 비밀번호 반환
        Map<String, Object> result = new LinkedHashMap<>();
        result.put("username", user.getUsername());

        if (mailService.isEnabled() && user.getEmail() != null && !user.getEmail().isBlank()) {
            // 메일 서버 활성화 + 사용자 이메일 존재 → 이메일로 발송 (관리자에게 PW 노출 안 함)
            Map<String, Object> mailVars = new LinkedHashMap<>();
            mailVars.put("userName", user.getName());
            mailVars.put("tempPassword", tempPassword);
            mailVars.put("systemName", "PeakMate");
            mailVars.put("sentAt", java.time.LocalDateTime.now()
                    .format(java.time.format.DateTimeFormatter.ofPattern("yyyy-MM-dd HH:mm:ss")));
            mailService.send(user.getEmail(), "[PeakMate] 비밀번호 초기화 안내", "password-reset", mailVars);

            result.put("emailSent", true);
            result.put("message", "임시 비밀번호가 " + user.getEmail() + "로 발송되었습니다.");
        } else {
            // 메일 비활성 또는 이메일 미등록 → 관리자에게 직접 표시 (폴백)
            result.put("emailSent", false);
            result.put("tempPassword", tempPassword);
            result.put("message", "다음 로그인 시 비밀번호 변경이 강제됩니다. 임시 비밀번호를 사용자에게 전달해주세요.");
        }
        return ApiResponse.success(result);
    }

    /**
     * 임시 비밀번호 생성 (비밀번호 정책 충족: 12자, 대/소/숫자/특수문자 포함)
     */
    private String generateTempPassword() {
        SecureRandom random = new SecureRandom();
        String upper = "ABCDEFGHJKLMNPQRSTUVWXYZ";
        String lower = "abcdefghjkmnpqrstuvwxyz";
        String digits = "23456789";
        String special = "!@#$%&*";

        StringBuilder sb = new StringBuilder();
        // 각 종류에서 최소 1자씩
        sb.append(upper.charAt(random.nextInt(upper.length())));
        sb.append(lower.charAt(random.nextInt(lower.length())));
        sb.append(digits.charAt(random.nextInt(digits.length())));
        sb.append(special.charAt(random.nextInt(special.length())));

        // 나머지 8자 랜덤 채움
        String all = upper + lower + digits + special;
        for (int i = 0; i < 8; i++) {
            sb.append(all.charAt(random.nextInt(all.length())));
        }

        // 셔플
        char[] chars = sb.toString().toCharArray();
        for (int i = chars.length - 1; i > 0; i--) {
            int j = random.nextInt(i + 1);
            char temp = chars[i];
            chars[i] = chars[j];
            chars[j] = temp;
        }
        return new String(chars);
    }

    private Map<String, Object> toUserMap(AdminUser user, String currentUsername) {
        boolean isSelf = user.getUsername().equals(currentUsername);
        PersonalInfoMasker.AccessLevel accessLevel = isSelf
                ? PersonalInfoMasker.AccessLevel.FULL
                : PersonalInfoMasker.AccessLevel.PARTIAL;

        List<String> roles = adminUserRoleRepository.findRoleCodesByAdminUserId(user.getId());

        Map<String, Object> map = new LinkedHashMap<>();
        map.put("id", user.getId());
        map.put("username", user.getUsername());
        map.put("name", PersonalInfoMasker.maskName(user.getName(), accessLevel));
        map.put("email", PersonalInfoMasker.maskEmail(user.getEmail(), accessLevel));
        map.put("employeeNumber", "EMP" + String.format("%03d", user.getId()));
        map.put("enabled", user.getStatus() != null && "ACTIVE".equals(user.getStatus().name()));
        map.put("roles", roles);
        map.put("departmentId", null);
        map.put("positionId", null);
        map.put("companyId", null);
        map.put("userType", "INTERNAL");
        map.put("partnerId", null);
        return map;
    }

    private String getCurrentUsername() {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        return auth != null ? auth.getName() : "UNKNOWN";
    }
}
