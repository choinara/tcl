package com.peakmate.backend.interfaces.i18n.controller;

import com.peakmate.backend.application.i18n.I18nSyncService;
import com.peakmate.backend.domain.i18n.entity.I18nMessage;
import com.peakmate.core.common.ApiResponse;
import com.peakmate.backend.infra.repository.i18n.I18nMessageJpaRepository;
import com.peakmate.core.security.annotation.RequirePermission;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

@Slf4j
@RestController
@RequestMapping("/api/system/i18n")
@RequiredArgsConstructor
public class I18nMessageController {

    private final I18nMessageJpaRepository repository;
    private final I18nSyncService syncService;

    @RequirePermission(menu = "SM0100", action = "read")
    @GetMapping("/messages")
    public ApiResponse<List<I18nMessage>> getAll() {
        List<I18nMessage> messages = repository.findByIsActiveOrderByMessageKeyAsc("Y");
        return ApiResponse.success(messages);
    }

    @RequirePermission(menu = "SM0100", action = "read")
    @GetMapping("/messages/{langCode}")
    public ApiResponse<Map<String, String>> getByLang(@PathVariable String langCode) {
        List<I18nMessage> messages = repository.findByLangCodeAndIsActiveOrderByMessageKeyAsc(langCode, "Y");
        Map<String, String> result = new HashMap<>();
        for (I18nMessage m : messages) {
            result.put(m.getMessageKey(), m.getMessageValue());
        }
        return ApiResponse.success(result);
    }

    @RequirePermission(menu = "SM0100", action = "update")
    @PutMapping("/messages")
    public ApiResponse<Void> saveAll(@RequestBody List<Map<String, String>> rows) {
        int updated = 0;
        int created = 0;
        for (Map<String, String> row : rows) {
            String langCode = row.get("langCode");
            String messageKey = row.get("messageKey");
            String messageValue = row.get("messageValue");
            if (langCode == null || messageKey == null) continue;

            var existing = repository.findByLangCodeAndMessageKey(langCode, messageKey);
            if (existing.isPresent()) {
                existing.get().updateValue(messageValue);
                repository.save(existing.get());
                updated++;
            } else {
                repository.save(I18nMessage.create(langCode, messageKey, messageValue));
                created++;
            }
        }
        return ApiResponse.success("저장 완료 (생성: %d, 수정: %d)".formatted(created, updated));
    }

    @RequirePermission(menu = "SM0100", action = "create")
    @PostMapping("/sync")
    public ApiResponse<Integer> syncAll(@RequestBody List<Map<String, String>> requests) {
        int inserted = syncService.syncAll(requests);
        return ApiResponse.success(inserted, "동기화 완료: %d건 등록".formatted(inserted));
    }

    @RequirePermission(menu = "SM0100", action = "delete")
    @DeleteMapping("/messages/{id}")
    public ApiResponse<Void> delete(@PathVariable Long id) {
        repository.deleteById(id);
        return ApiResponse.success("삭제되었습니다");
    }
}
