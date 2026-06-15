package com.peakmate.backend.application.auth.facade;

import com.peakmate.backend.application.auth.dto.command.LoginCommand;
import com.peakmate.backend.application.auth.dto.command.RefreshTokenReissueCommand;
import com.peakmate.backend.application.auth.dto.command.TokenReissueCommand;
import com.peakmate.backend.application.auth.dto.result.LoginResult;
import com.peakmate.backend.application.auth.dto.result.TokenReissueResult;
import com.peakmate.backend.domain.admin.entity.AdminUser;
import com.peakmate.backend.domain.auth.service.AuthDomainService;
import com.peakmate.backend.domain.auth.AuthTokens;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Component;

import java.util.Map;

/**
 * 인증 관련 유스케이스를 조합하는 Facade.
 * Application 계층에서 도메인 서비스를 조합하여 유스케이스를 구현합니다.
 */
@Component
@RequiredArgsConstructor
public class AuthFacade {

    private final AuthDomainService authDomainService;

    /**
     * 로그인 처리
     *
     * @param command 로그인 Command
     * @return 로그인 결과 (토큰 정보)
     */
    public LoginResult login(LoginCommand command) {
        AuthTokens tokens = authDomainService.authenticate(
                command.username(),
                command.password());

        return new LoginResult(tokens.accessToken(), tokens.refreshToken());
    }

    /**
     * 이미 검증된 AdminUser로 로그인 처리 (중복 검증 방지용)
     */
    public LoginResult loginWithValidatedUser(AdminUser user, String rawPassword) {
        AuthTokens tokens = authDomainService.generateTokensForValidatedUser(user, rawPassword);
        return new LoginResult(tokens.accessToken(), tokens.refreshToken());
    }

    /**
     * 토큰 재발행 처리
     * Access Token과 Refresh Token 모두 재발급합니다.
     *
     * @param command 토큰 재발급 Command
     * @return 재발행된 토큰 정보 (accessToken, refreshToken)
     */
    public TokenReissueResult reissueTokens(TokenReissueCommand command) {
        AuthTokens tokens = authDomainService.reissueTokens(command.username(), command.claims(), command.oldJti());
        return new TokenReissueResult(tokens.accessToken(), tokens.refreshToken());
    }

    /**
     * Refresh Token만 재발행 처리
     * 세션 연장 효과 없음 (Access Token은 갱신되지 않음)
     *
     * @param command Refresh Token 재발급 Command
     * @return 재발행된 Refresh Token
     */
    public String reissueRefreshToken(RefreshTokenReissueCommand command) {
        return authDomainService.reissueRefreshToken(command.username());
    }
}
