package com.peakmate.backend.infra.security.config;

import com.peakmate.backend.infra.security.jwt.JwtAuthenticationFilter;
import lombok.RequiredArgsConstructor;
import org.springframework.boot.context.properties.EnableConfigurationProperties;
import org.springframework.boot.web.servlet.FilterRegistrationBean;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.config.annotation.method.configuration.EnableMethodSecurity;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.config.annotation.web.configurers.AbstractHttpConfigurer;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.DelegatingPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.crypto.password.Pbkdf2PasswordEncoder;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter;
import org.springframework.security.web.header.writers.ReferrerPolicyHeaderWriter;
import org.springframework.security.web.header.writers.StaticHeadersWriter;
import org.springframework.web.cors.CorsConfiguration;
import org.springframework.web.cors.CorsConfigurationSource;
import org.springframework.web.cors.UrlBasedCorsConfigurationSource;

import java.util.Arrays;
import java.util.List;

@Configuration
@EnableWebSecurity
@EnableMethodSecurity
@EnableConfigurationProperties(EdgeServerProperties.class)
@RequiredArgsConstructor
public class SecurityConfig {

    private final JwtAuthenticationFilter jwtAuthenticationFilter;
    private final JwtAuthenticationEntryPoint jwtAuthenticationEntryPoint;
    private final ApiKeyAuthFilter apiKeyAuthFilter;

    private final com.peakmate.core.config.SecurityProperties securityProperties;

    @org.springframework.beans.factory.annotation.Value("${spring.profiles.active:local}")
    private String activeProfile;

    // ApiKeyAuthFilter, JwtAuthenticationFilter: Spring Security 필터 체인에만 등록 (서블릿 컨테이너 중복 등록 방지)
    @Bean
    public FilterRegistrationBean<ApiKeyAuthFilter> apiKeyFilterRegistration(ApiKeyAuthFilter filter) {
        FilterRegistrationBean<ApiKeyAuthFilter> registration = new FilterRegistrationBean<>(filter);
        registration.setEnabled(false);
        return registration;
    }

    @Bean
    public FilterRegistrationBean<JwtAuthenticationFilter> jwtFilterRegistration(JwtAuthenticationFilter filter) {
        FilterRegistrationBean<JwtAuthenticationFilter> registration = new FilterRegistrationBean<>(filter);
        registration.setEnabled(false);
        return registration;
    }

    // PasswordEncoder Bean은 core-be PasswordEncoderConfig에서 자동 등록

    @Bean
    public CorsConfigurationSource corsConfigurationSource() {
        CorsConfiguration configuration = new CorsConfiguration();
        configuration.setAllowedOriginPatterns(Arrays.asList(securityProperties.cors().allowedOrigins().split(",")));
        configuration.setAllowedMethods(Arrays.asList("GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"));
        configuration.setAllowedHeaders(Arrays.asList("Authorization", "Content-Type", "X-Requested-With"));
        configuration.setExposedHeaders(List.of("Authorization", "X-Token-Expiring"));
        configuration.setAllowCredentials(true);
        configuration.setMaxAge(3600L);

        UrlBasedCorsConfigurationSource source = new UrlBasedCorsConfigurationSource();
        source.registerCorsConfiguration("/**", configuration);
        return source;
    }

    @Bean
    public SecurityFilterChain filterChain(HttpSecurity http) throws Exception {
        http
                .cors(cors -> cors.configurationSource(corsConfigurationSource()))
                .csrf(AbstractHttpConfigurer::disable)
                .sessionManagement(session -> session.sessionCreationPolicy(SessionCreationPolicy.STATELESS))
                .headers(headers -> {
                    headers.httpStrictTransportSecurity(hsts -> hsts
                            .includeSubDomains(true)
                            .maxAgeInSeconds(31536000)
                    );
                    headers.contentTypeOptions(contentType -> {});
                    headers.frameOptions(frame -> frame.deny());
                    headers.referrerPolicy(referrer ->
                            referrer.policy(ReferrerPolicyHeaderWriter.ReferrerPolicy.STRICT_ORIGIN_WHEN_CROSS_ORIGIN)
                    );
                    headers.addHeaderWriter(new StaticHeadersWriter(
                            "Content-Security-Policy",
                            "default-src 'self'; " +
                            "script-src 'self' 'unsafe-inline' 'unsafe-eval'; " +
                            "style-src 'self' 'unsafe-inline'; " +
                            "img-src 'self' data: blob:; " +
                            "font-src 'self' data:; " +
                            "connect-src 'self'; " +
                            "frame-ancestors 'none'; " +
                            "base-uri 'self'; " +
                            "form-action 'self'"
                    ));
                    headers.addHeaderWriter(new StaticHeadersWriter(
                            "Permissions-Policy",
                            "camera=(), microphone=(), geolocation=()"
                    ));
                    headers.addHeaderWriter(new StaticHeadersWriter(
                            "X-Robots-Tag",
                            "noindex, nofollow, noarchive"
                    ));
                })
                .authorizeHttpRequests(auth -> auth
                        // 정적 리소스 허용 (Frontend SPA)
                        .requestMatchers("/", "/index.html", "/favicon.ico").permitAll()
                        .requestMatchers("/assets/**", "/*.js", "/*.css", "/*.png", "/*.svg", "/*.ico").permitAll()
                        // 인증 API 허용
                        .requestMatchers("/api/auth/login", "/api/auth/logout", "/api/auth/refresh").permitAll()
                        .requestMatchers("/api/admin/users", "/api/admin/users/exists").permitAll()
                        .requestMatchers("/error").permitAll()
                        // Swagger UI: local/dev/test 프로필에서만 허용
                        .requestMatchers("/swagger-ui/**", "/v3/api-docs/**").access((authentication, context) ->
                                new org.springframework.security.authorization.AuthorizationDecision(
                                        List.of("local", "dev", "test").contains(activeProfile)))
                        // SSE 세션 이벤트 (티켓 기반 인증, 컨트롤러에서 직접 검증)
                        .requestMatchers("/api/session/events").permitAll()
                        // 헬스체크 허용
                        .requestMatchers("/api/health", "/api/health/**").permitAll()
                        // 공통코드 조회 API (인증 불필요, GET만)
                        .requestMatchers(org.springframework.http.HttpMethod.GET, "/api/common-codes/**").permitAll()
                        // 시스템 알림 (활성 공지 배너용만 허용)
                        .requestMatchers("/api/system/notifications/active").permitAll()
                        // 조직 관리 (드롭다운 목록용만 허용)
                        .requestMatchers("/api/organization/departments/all", "/api/organization/companies/all", "/api/organization/positions/all").permitAll()
                        // 협력사 목록 (드롭다운용)
                        .requestMatchers("/api/master/partners/all").permitAll()
                        // 엣지 서버 수집 API (API Key 인증 — JWT 불필요)
                        .requestMatchers("/api/opcua/ingest", "/api/vision/ingest").permitAll()
                        .requestMatchers("/api/opcua/gateway/heartbeat").permitAll()
                        // Actuator 허용
                        .requestMatchers("/actuator/health", "/actuator/info").permitAll()
                        // SPA 프론트엔드 라우트 허용 (React Router)
                        .requestMatchers(request ->
                                !request.getRequestURI().startsWith("/api/"))
                        .permitAll()
                        .anyRequest().authenticated())
                .exceptionHandling(ex -> ex.authenticationEntryPoint(jwtAuthenticationEntryPoint))
                .addFilterBefore(jwtAuthenticationFilter, UsernamePasswordAuthenticationFilter.class)
                .addFilterBefore(apiKeyAuthFilter, JwtAuthenticationFilter.class);

        return http.build();
    }
}
