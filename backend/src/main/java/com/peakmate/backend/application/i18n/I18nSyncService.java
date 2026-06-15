package com.peakmate.backend.application.i18n;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.sql.Timestamp;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;

@Service
@Slf4j
@RequiredArgsConstructor
public class I18nSyncService {

    private final JdbcTemplate jdbcTemplate;

    /**
     * 전체 번역 데이터를 DB에 일괄 동기화.
     * 이미 존재하는 키는 건너뛰고 (ON CONFLICT DO NOTHING),
     * DB에 없는 키만 신규 등록.
     */
    @Transactional
    public int syncAll(List<Map<String, String>> requests) {
        String sql = "INSERT INTO i18n_message " +
                "(lang_code, message_key, message_value, is_active, created_at, updated_at) " +
                "VALUES (?, ?, ?, 'Y', ?, ?) " +
                "ON CONFLICT (lang_code, message_key) DO NOTHING";

        Timestamp now = Timestamp.valueOf(LocalDateTime.now());

        List<Object[]> batchArgs = new ArrayList<>();
        for (Map<String, String> req : requests) {
            String langCode = req.get("langCode");
            String messageKey = req.get("messageKey");
            String messageValue = req.get("messageValue");
            if (langCode == null || messageKey == null) continue;
            if (messageValue == null || messageValue.isEmpty()) continue;
            batchArgs.add(new Object[]{ langCode, messageKey, messageValue, now, now });
        }

        int[][] results = jdbcTemplate.batchUpdate(sql, batchArgs, 500,
                (ps, args) -> {
                    ps.setString(1, (String) args[0]);
                    ps.setString(2, (String) args[1]);
                    ps.setString(3, (String) args[2]);
                    ps.setTimestamp(4, (Timestamp) args[3]);
                    ps.setTimestamp(5, (Timestamp) args[4]);
                });

        int totalInserted = 0;
        for (int[] batch : results) {
            for (int r : batch) {
                if (r > 0) totalInserted++;
            }
        }

        log.info("I18n sync completed: {} inserted out of {} total", totalInserted, batchArgs.size());
        return totalInserted;
    }
}
