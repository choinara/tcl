package com.peakmate.core.security.config;

import org.springframework.boot.autoconfigure.condition.ConditionalOnMissingBean;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.DelegatingPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.crypto.password.Pbkdf2PasswordEncoder;

import java.util.HashMap;
import java.util.Map;

/**
 * PBKDF2WithHmacSHA512 (10만 반복, 공공기관 보안 기준) + BCrypt 레거시 폴백.
 * @ConditionalOnMissingBean: 프로젝트에서 커스텀 PasswordEncoder를 등록하면 이 Bean은 비활성화.
 */
@Configuration
public class PasswordEncoderConfig {

    @Bean
    @ConditionalOnMissingBean
    public PasswordEncoder passwordEncoder() {
        Pbkdf2PasswordEncoder pbkdf2Encoder = new Pbkdf2PasswordEncoder(
                "", 16, 100000,
                Pbkdf2PasswordEncoder.SecretKeyFactoryAlgorithm.PBKDF2WithHmacSHA512);
        pbkdf2Encoder.setEncodeHashAsBase64(true);

        Map<String, PasswordEncoder> encoders = new HashMap<>();
        encoders.put("pbkdf2", pbkdf2Encoder);
        encoders.put("bcrypt", new BCryptPasswordEncoder());

        DelegatingPasswordEncoder delegating = new DelegatingPasswordEncoder("pbkdf2", encoders);
        delegating.setDefaultPasswordEncoderForMatches(pbkdf2Encoder);
        return delegating;
    }
}
