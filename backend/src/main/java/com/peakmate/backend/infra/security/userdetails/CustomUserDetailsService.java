package com.peakmate.backend.infra.security.userdetails;

import com.peakmate.backend.domain.admin.entity.AdminUser;
import com.peakmate.backend.domain.admin.repository.AdminUserRepository;
import com.peakmate.backend.domain.admin.repository.AdminUserRoleRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class CustomUserDetailsService implements UserDetailsService {

    private final AdminUserRepository adminUserRepository;
    private final AdminUserRoleRepository adminUserRoleRepository;

    @Override
    public UserDetails loadUserByUsername(String username) throws UsernameNotFoundException {
        return adminUserRepository.findByUsername(username)
                .map(this::createUserDetails)
                .orElseThrow(() -> new UsernameNotFoundException("User not found with username: " + username));
    }

    private UserDetails createUserDetails(AdminUser adminUser) {
        // 사용자의 실제 역할 목록 조회
        List<String> roleCodes = adminUserRoleRepository.findRoleCodesByAdminUserId(adminUser.getId());

        // roleCode를 Spring Security의 GrantedAuthority로 변환
        List<SimpleGrantedAuthority> authorities = roleCodes.stream()
                .map(roleCode -> new SimpleGrantedAuthority("ROLE_" + roleCode))
                .collect(Collectors.toList());

        // CustomUserDetails 생성 (id 포함)
        return new CustomUserDetails(
                adminUser.getId(),
                adminUser.getUsername(),
                adminUser.getPassword(),
                authorities
        );
    }
}
