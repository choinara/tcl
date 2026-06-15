package com.peakmate.backend.infra.config;

import com.peakmate.core.config.SecurityProperties;
import com.peakmate.core.security.CookieUtil;
import jakarta.annotation.PostConstruct;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.context.annotation.Configuration;

@Configuration
@RequiredArgsConstructor
@Slf4j
public class CookieSecureConfig {

    private final SecurityProperties securityProperties;

    @PostConstruct
    public void init() {
        boolean cookieSecure = securityProperties.cookie().secure();
        CookieUtil.setSecure(cookieSecure);
        log.info("Cookie Secure flag set to: {}", cookieSecure);
    }
}
