package com.peakmate.backend.infra.security.oauth2;

import com.peakmate.backend.domain.admin.entity.AdminUser;
import com.peakmate.backend.domain.admin.repository.AdminUserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.security.oauth2.client.userinfo.DefaultOAuth2UserService;
import org.springframework.security.oauth2.client.userinfo.OAuth2UserRequest;
import org.springframework.security.oauth2.core.OAuth2AuthenticationException;
import org.springframework.security.oauth2.core.user.OAuth2User;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.Map;

/**
 * OAuth2 로그인 성공 시 사용자 매핑/생성 서비스.
 */
@Service
@RequiredArgsConstructor
@Slf4j
@ConditionalOnProperty(name = "spring.security.oauth2.enabled", havingValue = "true", matchIfMissing = false)
public class CustomOAuth2UserService extends DefaultOAuth2UserService {

    private final AdminUserRepository adminUserRepository;

    @Override
    @Transactional
    public OAuth2User loadUser(OAuth2UserRequest userRequest) throws OAuth2AuthenticationException {
        OAuth2User oAuth2User = super.loadUser(userRequest);

        String registrationId = userRequest.getClientRegistration().getRegistrationId();
        Map<String, Object> attributes = oAuth2User.getAttributes();

        String email = (String) attributes.get("email");
        String name = (String) attributes.get("name");

        if (email == null) {
            throw new OAuth2AuthenticationException("OAuth2 Provider에서 이메일 정보를 가져올 수 없습니다");
        }

        AdminUser user = adminUserRepository.findByUsername(email).orElse(null);
        if (user == null) {
            user = AdminUser.create(email, "{noop}OAUTH2_USER", name != null ? name : email, email, null);
            user = adminUserRepository.save(user);
            log.info("Created new OAuth2 user: {} (provider: {})", email, registrationId);
        }

        user.updateLastLoginAt(LocalDateTime.now());
        adminUserRepository.save(user);

        log.info("OAuth2 login: {} (provider: {})", email, registrationId);
        return oAuth2User;
    }
}
