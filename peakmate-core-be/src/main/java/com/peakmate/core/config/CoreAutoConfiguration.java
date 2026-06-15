package com.peakmate.core.config;

import com.peakmate.core.security.jwt.JwtTokenProvider;
import org.springframework.boot.autoconfigure.condition.ConditionalOnMissingBean;
import org.springframework.boot.context.properties.EnableConfigurationProperties;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.core.io.ResourceLoader;

/**
 * peakmate-core-be 자동 설정.
 * @ConfigurationProperties 활성화 + JwtTokenProvider Bean 자동 등록.
 */
@Configuration
@EnableConfigurationProperties({JwtProperties.class, SecurityProperties.class})
public class CoreAutoConfiguration {

    @Bean
    @ConditionalOnMissingBean
    public JwtTokenProvider jwtTokenProvider(JwtProperties properties, ResourceLoader resourceLoader) {
        return new JwtTokenProvider(properties, resourceLoader);
    }
}
