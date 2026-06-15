package com.peakmate.backend.infra.security.config;

import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.context.annotation.Configuration;

/**
 * OAuth2/OIDC SSO 연동 설정.
 * spring.security.oauth2.enabled=true 설정 시 활성화됩니다.
 *
 * application.yml 예시:
 * <pre>
 * spring:
 *   security:
 *     oauth2:
 *       enabled: true
 *       client:
 *         registration:
 *           google:
 *             client-id: ${OAUTH2_GOOGLE_CLIENT_ID}
 *             client-secret: ${OAUTH2_GOOGLE_CLIENT_SECRET}
 *             scope: openid, profile, email
 *           keycloak:
 *             client-id: ${OAUTH2_KEYCLOAK_CLIENT_ID}
 *             client-secret: ${OAUTH2_KEYCLOAK_CLIENT_SECRET}
 *             scope: openid, profile, email
 *             authorization-grant-type: authorization_code
 *         provider:
 *           keycloak:
 *             issuer-uri: ${OAUTH2_KEYCLOAK_ISSUER_URI}
 * </pre>
 */
@Configuration
@ConditionalOnProperty(name = "spring.security.oauth2.enabled", havingValue = "true", matchIfMissing = false)
public class OAuth2LoginConfig {
    // OAuth2 login configuration marker.
    // Activate by setting spring.security.oauth2.enabled=true.
}
