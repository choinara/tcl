package com.peakmate.backend.interfaces.system.controller;

import com.peakmate.backend.domain.system.service.SystemSettingService;
import com.peakmate.backend.infra.mail.MailService;
import com.peakmate.core.common.ApiResponse;
import com.peakmate.core.log.SystemLog;
import com.peakmate.core.security.annotation.RequirePermission;
import com.peakmate.core.crypto.AES256Encryptor;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.LinkedHashMap;
import java.util.Map;
import java.util.regex.Pattern;

@Slf4j
@RestController
@RequestMapping("/api/system/settings")
@RequiredArgsConstructor
public class SystemSettingController {

    private final SystemSettingService systemSettingService;
    private final MailService mailService;

    private static final Pattern EMAIL_PATTERN = Pattern.compile(
            "^[A-Za-z0-9+_.-]+@[A-Za-z0-9.-]+\\.[A-Za-z]{2,}$");
    private static final Pattern HOST_PATTERN = Pattern.compile(
            "^[A-Za-z0-9]([A-Za-z0-9.-]*[A-Za-z0-9])?$");

    // ── 다중로그인 설정 ──

    @RequirePermission(menu = "SM0040", action = "read")
    @GetMapping("/single-login")
    public ApiResponse<Map<String, Object>> getSingleLoginSetting() {
        boolean enabled = systemSettingService.isSingleLoginEnabled();
        return ApiResponse.success(Map.of("enabled", enabled));
    }

    @RequirePermission(menu = "SM0040", action = "update")
    @SystemLog(type = "SETTING_CHANGE", action = "단일로그인 설정 변경")
    @PutMapping("/single-login")
    public ApiResponse<Map<String, Object>> updateSingleLoginSetting(@RequestBody Map<String, Boolean> body) {
        boolean enabled = body.getOrDefault("enabled", true);
        systemSettingService.updateValue("security.single-login", String.valueOf(enabled));

        return ApiResponse.success(Map.of("enabled", enabled));
    }

    // ── 메일 설정 ──

    /**
     * 메일 설정 조회
     */
    @RequirePermission(menu = "SM0040", action = "read")
    @GetMapping("/mail")
    public ApiResponse<Map<String, String>> getMailSettings() {
        return ApiResponse.success(mailService.getSettings());
    }

    /**
     * 메일 설정 저장 (비밀번호는 AES-256-GCM 암호화 저장)
     */
    @RequirePermission(menu = "SM0040", action = "update")
    @SystemLog(type = "SETTING_CHANGE", action = "메일 설정 변경")
    @PutMapping("/mail")
    public ApiResponse<Map<String, String>> updateMailSettings(@RequestBody Map<String, String> body) {
        // ── 입력값 검증 ──
        String port = body.get("port");
        if (port != null && !port.isBlank()) {
            try {
                int portNum = Integer.parseInt(port);
                if (portNum < 1 || portNum > 65535) {
                    return ApiResponse.error("MAIL_VALID", "포트 번호는 1~65535 범위여야 합니다.");
                }
            } catch (NumberFormatException e) {
                return ApiResponse.error("MAIL_VALID", "포트 번호는 숫자여야 합니다.");
            }
        }
        String host = body.get("host");
        if (host != null && !host.isBlank() && !HOST_PATTERN.matcher(host).matches()) {
            return ApiResponse.error("MAIL_VALID", "올바른 호스트명을 입력해주세요.");
        }
        String username = body.get("username");
        if (username != null && !username.isBlank() && !EMAIL_PATTERN.matcher(username).matches()) {
            return ApiResponse.error("MAIL_VALID", "인증 계정은 올바른 이메일 형식이어야 합니다.");
        }
        String fromAddress = body.get("fromAddress");
        if (fromAddress != null && !fromAddress.isBlank() && !EMAIL_PATTERN.matcher(fromAddress).matches()) {
            return ApiResponse.error("MAIL_VALID", "올바른 이메일 형식을 입력해주세요.");
        }

        Map<String, String> keyMap = Map.of(
                "enabled", "mail.enabled",
                "host", "mail.host",
                "port", "mail.port",
                "username", "mail.username",
                "password", "mail.password",
                "smtpAuth", "mail.smtp-auth",
                "starttls", "mail.starttls",
                "fromAddress", "mail.from-address",
                "fromName", "mail.from-name"
        );

        for (Map.Entry<String, String> entry : body.entrySet()) {
            String settingKey = keyMap.get(entry.getKey());
            if (settingKey != null) {
                String value = entry.getValue();
                // 비밀번호는 AES-256-GCM으로 암호화하여 저장
                if ("mail.password".equals(settingKey) && value != null && !value.isBlank()) {
                    AES256Encryptor encryptor = AES256Encryptor.getInstance();
                    if (encryptor.isConfigured()) {
                        value = "ENC:" + encryptor.encrypt(value);
                    }
                }
                systemSettingService.upsertValue(settingKey, value);
            }
        }

        return ApiResponse.success(mailService.getSettings());
    }

    /**
     * 메일 서버 연결 테스트
     */
    @RequirePermission(menu = "SM0040", action = "update")
    @PostMapping("/mail/test-connection")
    public ApiResponse<Map<String, Object>> testMailConnection() {
        if (!mailService.isEnabled()) {
            return ApiResponse.error("MAIL002", "메일 기능이 비활성화 상태입니다. 먼저 활성화해주세요.");
        }
        boolean ok = mailService.testConnection();
        Map<String, Object> result = new LinkedHashMap<>();
        result.put("success", ok);
        result.put("message", ok ? "메일 서버 연결 성공" : "메일 서버 연결 실패. 호스트/포트/인증 정보를 확인하세요.");
        return ApiResponse.success(result);
    }

    /**
     * 테스트 메일 발송
     */
    @RequirePermission(menu = "SM0040", action = "update")
    @PostMapping("/mail/test-send")
    public ApiResponse<Map<String, Object>> testSendMail(@RequestBody Map<String, String> body) {
        String to = body.get("to");
        if (to == null || to.isBlank()) {
            return ApiResponse.error("MAIL001", "수신자 이메일 주소가 필요합니다.");
        }
        if (!EMAIL_PATTERN.matcher(to).matches()) {
            return ApiResponse.error("MAIL001", "올바른 이메일 형식을 입력해주세요.");
        }
        if (!mailService.isEnabled()) {
            return ApiResponse.error("MAIL002", "메일 기능이 비활성화 상태입니다. 먼저 활성화해주세요.");
        }

        Map<String, Object> vars = new LinkedHashMap<>();
        vars.put("title", "메일 발송 테스트");
        vars.put("message", "PeakMate 메일 서버 연동 테스트입니다.<br/>이 메일이 정상 수신되면 메일 설정이 올바릅니다.");
        vars.put("systemName", "PeakMate");
        vars.put("level", "info");
        vars.put("sentAt", LocalDateTime.now().format(DateTimeFormatter.ofPattern("yyyy-MM-dd HH:mm:ss")));

        boolean success = mailService.sendSync(to, "[PeakMate] 메일 발송 테스트", "notification", vars);

        if (!success) {
            return ApiResponse.error("MAIL003", "메일 발송에 실패했습니다. 메일 서버 설정을 확인해주세요.");
        }
        return ApiResponse.success(Map.of("message", to + "로 테스트 메일을 발송했습니다."));
    }
}
