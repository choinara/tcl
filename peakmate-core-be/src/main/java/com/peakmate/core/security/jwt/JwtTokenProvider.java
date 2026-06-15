package com.peakmate.core.security.jwt;

import com.peakmate.core.config.JwtProperties;
import com.peakmate.core.security.TokenProvider;
import io.jsonwebtoken.*;
import io.jsonwebtoken.security.SecurityException;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.InitializingBean;
import org.springframework.core.io.Resource;
import org.springframework.core.io.ResourceLoader;

import java.io.InputStream;
import java.nio.charset.StandardCharsets;
import java.security.KeyFactory;
import java.security.KeyPair;
import java.security.KeyPairGenerator;
import java.security.PrivateKey;
import java.security.PublicKey;
import java.security.spec.PKCS8EncodedKeySpec;
import java.security.spec.X509EncodedKeySpec;
import java.time.LocalDateTime;
import java.time.ZoneId;
import java.util.Base64;
import java.util.Date;
import java.util.Map;
import java.util.UUID;

/**
 * JWT RS256 토큰 생성/검증 프로바이더.
 * Bean 등록은 consumer 프로젝트에서 수행 (Auto-configuration 또는 @Bean).
 */
@Slf4j
public class JwtTokenProvider implements InitializingBean, TokenProvider {

    private static final String AUTHORITIES_KEY = "auth";
    private static final String TOKEN_TYPE_KEY = "type";
    private static final String TYPE_ACCESS = "ACCESS";
    private static final String TYPE_REFRESH = "REFRESH";

    private static final long REISSUE_THRESHOLD = 5 * 60 * 1000L;

    private final String privateKeyPath;
    private final String publicKeyPath;
    private final long accessTokenValidity;
    private final long refreshTokenValidity;
    private final ResourceLoader resourceLoader;

    private PrivateKey privateKey;
    private PublicKey publicKey;

    public JwtTokenProvider(JwtProperties jwtProperties, ResourceLoader resourceLoader) {
        this.privateKeyPath = jwtProperties.privateKeyPath();
        this.publicKeyPath = jwtProperties.publicKeyPath();
        this.accessTokenValidity = jwtProperties.accessTokenValidity();
        this.refreshTokenValidity = jwtProperties.refreshTokenValidity();
        this.resourceLoader = resourceLoader;
    }

    @Override
    public void afterPropertiesSet() {
        try {
            this.privateKey = loadPrivateKey(privateKeyPath);
            this.publicKey = loadPublicKey(publicKeyPath);
            log.info("JWT RS256 키쌍 로딩 완료 (private: {}, public: {})", privateKeyPath, publicKeyPath);
        } catch (Exception e) {
            String activeProfile = System.getProperty("spring.profiles.active", "");
            if (activeProfile.isEmpty() || activeProfile.contains("local")) {
                log.warn("JWT 키 파일을 찾을 수 없어 개발용 키쌍을 자동 생성합니다: {}", e.getMessage());
                generateDevKeys();
            } else {
                throw new IllegalStateException(
                        "JWT RSA 키 파일을 로드할 수 없습니다. JWT_PRIVATE_KEY, JWT_PUBLIC_KEY 환경변수를 확인하세요.", e);
            }
        }
    }

    private void generateDevKeys() {
        try {
            KeyPairGenerator generator = KeyPairGenerator.getInstance("RSA");
            generator.initialize(2048);
            KeyPair keyPair = generator.generateKeyPair();
            this.privateKey = keyPair.getPrivate();
            this.publicKey = keyPair.getPublic();
            log.info("개발용 RS256 키쌍 자동 생성 완료 (메모리 전용, 재시작 시 재생성)");
        } catch (Exception e) {
            throw new IllegalStateException("개발용 RSA 키쌍 생성 실패", e);
        }
    }

    private PrivateKey loadPrivateKey(String path) throws Exception {
        Resource resource = resourceLoader.getResource(path);
        String pem;
        try (InputStream is = resource.getInputStream()) {
            pem = new String(is.readAllBytes(), StandardCharsets.UTF_8);
        }
        String base64 = pem
                .replace("-----BEGIN PRIVATE KEY-----", "")
                .replace("-----END PRIVATE KEY-----", "")
                .replace("-----BEGIN RSA PRIVATE KEY-----", "")
                .replace("-----END RSA PRIVATE KEY-----", "")
                .replaceAll("\\s", "");
        byte[] decoded = Base64.getDecoder().decode(base64);
        PKCS8EncodedKeySpec spec = new PKCS8EncodedKeySpec(decoded);
        return KeyFactory.getInstance("RSA").generatePrivate(spec);
    }

    private PublicKey loadPublicKey(String path) throws Exception {
        Resource resource = resourceLoader.getResource(path);
        String pem;
        try (InputStream is = resource.getInputStream()) {
            pem = new String(is.readAllBytes(), StandardCharsets.UTF_8);
        }
        String base64 = pem
                .replace("-----BEGIN PUBLIC KEY-----", "")
                .replace("-----END PUBLIC KEY-----", "")
                .replaceAll("\\s", "");
        byte[] decoded = Base64.getDecoder().decode(base64);
        X509EncodedKeySpec spec = new X509EncodedKeySpec(decoded);
        return KeyFactory.getInstance("RSA").generatePublic(spec);
    }

    @Override
    public String createAccessToken(String username, Map<String, Object> claims) {
        String jti = UUID.randomUUID().toString();
        return Jwts.builder()
                .id(jti)
                .claims(claims)
                .subject(username)
                .claim(TOKEN_TYPE_KEY, TYPE_ACCESS)
                .issuedAt(new Date())
                .expiration(new Date(System.currentTimeMillis() + accessTokenValidity))
                .signWith(privateKey)
                .compact();
    }

    @Override
    public String createRefreshToken(String username) {
        return Jwts.builder()
                .subject(username)
                .claim(TOKEN_TYPE_KEY, TYPE_REFRESH)
                .issuedAt(new Date())
                .expiration(new Date(System.currentTimeMillis() + refreshTokenValidity))
                .signWith(privateKey)
                .compact();
    }

    public boolean validateToken(String token) {
        try {
            Jwts.parser().verifyWith(publicKey).build().parseSignedClaims(token);
            return true;
        } catch (ExpiredJwtException e) {
            log.warn("만료된 JWT 토큰: {}", e.getMessage());
        } catch (UnsupportedJwtException e) {
            log.warn("지원하지 않는 JWT 토큰: {}", e.getMessage());
        } catch (MalformedJwtException e) {
            log.warn("잘못된 형식의 JWT 토큰: {}", e.getMessage());
        } catch (SecurityException e) {
            log.error("JWT 서명 검증 실패 (변조 의심): {}", e.getMessage());
        } catch (IllegalArgumentException e) {
            log.warn("JWT 토큰이 비어있음: {}", e.getMessage());
        }
        return false;
    }

    public Claims getClaims(String token) {
        return Jwts.parser().verifyWith(publicKey).build().parseSignedClaims(token).getPayload();
    }

    @Override
    public String getJti(String token) {
        return getClaims(token).getId();
    }

    public boolean isRefreshToken(String token) {
        return TYPE_REFRESH.equals(getClaims(token).get(TOKEN_TYPE_KEY));
    }

    public boolean isAccessToken(String token) {
        return TYPE_ACCESS.equals(getClaims(token).get(TOKEN_TYPE_KEY));
    }

    public boolean needsReissue(String token) {
        try {
            Claims claims = getClaims(token);
            if (!TYPE_ACCESS.equals(claims.get(TOKEN_TYPE_KEY))) return false;
            long diff = claims.getExpiration().getTime() - System.currentTimeMillis();
            return diff > 0 && diff < REISSUE_THRESHOLD;
        } catch (Exception e) {
            return false;
        }
    }

    @Override
    public String getUsername(String token) {
        return getClaims(token).getSubject();
    }

    @Override
    public LocalDateTime getExpiration(String token) {
        return getClaims(token).getExpiration()
                .toInstant()
                .atZone(ZoneId.systemDefault())
                .toLocalDateTime();
    }

    @Override
    public Map<String, Object> getClaimsMap(String token) {
        return getClaims(token);
    }

    @Override
    public String resolveToken(String authorizationHeader) {
        if (authorizationHeader != null && authorizationHeader.startsWith("Bearer ")) {
            return authorizationHeader.substring(7);
        }
        return null;
    }
}
