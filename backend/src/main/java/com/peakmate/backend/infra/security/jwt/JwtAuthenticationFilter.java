package com.peakmate.backend.infra.security.jwt;

import com.peakmate.backend.domain.admin.entity.AdminUser;
import com.peakmate.backend.domain.admin.repository.AdminUserRepository;
import com.peakmate.backend.domain.admin.service.AdminUserSessionDomainService;
import com.peakmate.backend.infra.security.util.TokenExtractUtil;
import com.peakmate.core.security.CookieUtil;
import com.peakmate.core.security.jwt.JwtTokenProvider;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.web.authentication.WebAuthenticationDetailsSource;
import org.springframework.stereotype.Component;
import org.springframework.util.AntPathMatcher;
import org.springframework.util.StringUtils;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;

@Component
@RequiredArgsConstructor
@Slf4j
public class JwtAuthenticationFilter extends OncePerRequestFilter {

    private final JwtTokenProvider tokenProvider;
    private final UserDetailsService userDetailsService;
    private final AdminUserRepository adminUserRepository;
    private final AdminUserSessionDomainService adminUserSessionDomainService;

    public static final String AUTHORIZATION_HEADER = "Authorization";

    // Refresh Token 전용 경로 패턴
    private static final String[] REFRESH_TOKEN_PATHS = {
            "/api/polling/**",
            "/api/auth/refresh-polling"
    };

    // 필터를 건너뛸 경로 (자체 토큰 검증 로직이 있는 엔드포인트)
    private static final String[] SKIP_FILTER_PATHS = {
            "/api/auth/login",
            "/api/auth/refresh"
    };

    private final AntPathMatcher pathMatcher = new AntPathMatcher();

    @Override
    protected void doFilterInternal(HttpServletRequest request, HttpServletResponse response, FilterChain filterChain)
            throws ServletException, IOException {

        String requestPath = request.getRequestURI();

        // 자체 토큰 검증 로직이 있는 경로는 필터 건너뛰기
        if (shouldSkipFilter(requestPath)) {
            filterChain.doFilter(request, response);
            return;
        }

        String jwt = TokenExtractUtil.resolve(request, tokenProvider, CookieUtil.ACCESS_TOKEN_COOKIE);

        if (StringUtils.hasText(jwt) && tokenProvider.validateToken(jwt)) {
            // 경로에 따른 토큰 타입 검증
            if (isRefreshTokenPath(requestPath)) {
                // Refresh 전용 경로: Refresh Token만 허용
                if (!tokenProvider.isRefreshToken(jwt)) {
                    log.warn("Access Token used for refresh path: {}", requestPath);
                    response.sendError(HttpServletResponse.SC_UNAUTHORIZED, "Refresh Token required");
                    return;
                }
            } else {
                // 일반 경로: Access Token만 허용
                if (!tokenProvider.isAccessToken(jwt)) {
                    log.warn("Refresh Token used for non-refresh path: {}", requestPath);
                    response.sendError(HttpServletResponse.SC_UNAUTHORIZED, "Access Token required");
                    return;
                }
            }

            String username = tokenProvider.getUsername(jwt);

            // DB 세션 검증: jti로 세션 일치 확인 (Access Token만)
            if (tokenProvider.isAccessToken(jwt)) {
                AdminUser user = adminUserRepository.findByUsername(username).orElse(null);
                String jti = tokenProvider.getJti(jwt);
                if (user == null || jti == null || !adminUserSessionDomainService.isValidSession(user.getId(), jti)) {
                    log.warn("세션 검증 실패 - 폐기된 토큰 사용 시도: {}", username);
                    response.sendError(HttpServletResponse.SC_UNAUTHORIZED, "Session expired");
                    return;
                }
            }

            UserDetails userDetails = userDetailsService.loadUserByUsername(username);

            UsernamePasswordAuthenticationToken authentication = new UsernamePasswordAuthenticationToken(
                    userDetails, null, userDetails.getAuthorities());
            authentication.setDetails(new WebAuthenticationDetailsSource().buildDetails(request));

            SecurityContextHolder.getContext().setAuthentication(authentication);

            // Access Token 만료 임박 시 프론트엔드에 갱신 신호 전송
            if (tokenProvider.isAccessToken(jwt) && tokenProvider.needsReissue(jwt)) {
                response.setHeader("X-Token-Expiring", "true");
            }
        }

        filterChain.doFilter(request, response);
    }

    /**
     * Refresh Token 전용 경로인지 확인
     */
    private boolean isRefreshTokenPath(String path) {
        for (String pattern : REFRESH_TOKEN_PATHS) {
            if (pathMatcher.match(pattern, path)) {
                return true;
            }
        }
        return false;
    }

    /**
     * 필터를 건너뛸 경로인지 확인 (자체 토큰 검증 로직이 있는 엔드포인트)
     */
    private boolean shouldSkipFilter(String path) {
        for (String pattern : SKIP_FILTER_PATHS) {
            if (pathMatcher.match(pattern, path)) {
                return true;
            }
        }
        return false;
    }
}
