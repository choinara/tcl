package com.peakmate.backend.infra.security.userdetails;

import lombok.Getter;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.core.userdetails.User;

import java.util.Collection;

/**
 * Spring Security의 UserDetails 확장 클래스.
 * 기본 User 클래스에 AdminUser의 id 필드를 추가합니다.
 */
@Getter
public class CustomUserDetails extends User {

    private final Long id;

    public CustomUserDetails(Long id, String username, String password,
                            Collection<? extends GrantedAuthority> authorities) {
        super(username, password, authorities);
        this.id = id;
    }

    public CustomUserDetails(Long id, String username, String password,
                            boolean enabled, boolean accountNonExpired,
                            boolean credentialsNonExpired, boolean accountNonLocked,
                            Collection<? extends GrantedAuthority> authorities) {
        super(username, password, enabled, accountNonExpired,
              credentialsNonExpired, accountNonLocked, authorities);
        this.id = id;
    }
}
