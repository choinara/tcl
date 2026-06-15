package com.peakmate.backend.infra.mail;

import com.peakmate.backend.domain.system.service.SystemSettingService;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.thymeleaf.TemplateEngine;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.BDDMockito.given;

/**
 * MailService 단위 테스트.
 * SMTP 실제 연결 없이 설정 로직과 활성화 상태를 검증합니다.
 */
@ExtendWith(MockitoExtension.class)
class MailServiceTest {

    @Mock
    private TemplateEngine templateEngine;

    @Mock
    private SystemSettingService settingService;

    @InjectMocks
    private MailService mailService;

    @Test
    @DisplayName("isEnabled - mail.enabled=true이면 true를 반환한다")
    void isEnabled_true() {
        given(settingService.getBooleanValue("mail.enabled", false)).willReturn(true);
        assertThat(mailService.isEnabled()).isTrue();
    }

    @Test
    @DisplayName("isEnabled - mail.enabled=false이면 false를 반환한다")
    void isEnabled_false() {
        given(settingService.getBooleanValue("mail.enabled", false)).willReturn(false);
        assertThat(mailService.isEnabled()).isFalse();
    }

    @Test
    @DisplayName("getSettings - DB 설정값을 Map으로 반환한다")
    void getSettings_returnsSettingsMap() {
        given(settingService.getValue("mail.enabled", "false")).willReturn("true");
        given(settingService.getValue("mail.host", "")).willReturn("smtp.test.com");
        given(settingService.getValue("mail.port", "25")).willReturn("587");
        given(settingService.getValue("mail.username", "")).willReturn("user@test.com");
        given(settingService.getValue("mail.smtp-auth", "false")).willReturn("true");
        given(settingService.getValue("mail.starttls", "false")).willReturn("true");
        given(settingService.getValue("mail.from-address", "noreply@peakmate.local")).willReturn("from@test.com");
        given(settingService.getValue("mail.from-name", "PeakMate")).willReturn("TestMate");

        var settings = mailService.getSettings();

        assertThat(settings).containsEntry("enabled", "true");
        assertThat(settings).containsEntry("host", "smtp.test.com");
        assertThat(settings).containsEntry("port", "587");
        assertThat(settings).containsEntry("username", "user@test.com");
        assertThat(settings).containsEntry("fromAddress", "from@test.com");
        assertThat(settings).containsEntry("fromName", "TestMate");
    }

    @Test
    @DisplayName("testConnection - 잘못된 설정이면 false를 반환한다")
    void testConnection_invalidConfig_returnsFalse() {
        given(settingService.getValue("mail.host", "localhost")).willReturn("invalid-host-that-does-not-exist");
        given(settingService.getValue("mail.port", "25")).willReturn("9999");
        given(settingService.getValue("mail.username", "")).willReturn("");
        given(settingService.getValue("mail.password", "")).willReturn("");
        given(settingService.getBooleanValue("mail.smtp-auth", false)).willReturn(false);
        given(settingService.getBooleanValue("mail.starttls", false)).willReturn(false);

        assertThat(mailService.testConnection()).isFalse();
    }

    @Test
    @DisplayName("sendSync - 잘못된 SMTP 설정이면 false를 반환한다")
    void sendSync_invalidSmtp_returnsFalse() {
        given(settingService.getValue("mail.host", "localhost")).willReturn("invalid-host");
        given(settingService.getValue("mail.port", "25")).willReturn("9999");
        given(settingService.getValue("mail.username", "")).willReturn("");
        given(settingService.getValue("mail.password", "")).willReturn("");
        given(settingService.getBooleanValue("mail.smtp-auth", false)).willReturn(false);
        given(settingService.getBooleanValue("mail.starttls", false)).willReturn(false);
        given(templateEngine.process(org.mockito.ArgumentMatchers.anyString(), org.mockito.ArgumentMatchers.any()))
                .willReturn("<html>test</html>");
        given(settingService.getValue("mail.from-address", "noreply@peakmate.local")).willReturn("test@test.com");
        given(settingService.getValue("mail.from-name", "PeakMate")).willReturn("Test");

        boolean result = mailService.sendSync("to@test.com", "Test", "notification", java.util.Map.of());
        assertThat(result).isFalse();
    }
}
