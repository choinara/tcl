package com.peakmate.backend.application.receipt;

import com.peakmate.backend.domain.receipt.entity.ReceiptRecord;
import com.peakmate.backend.infra.repository.receipt.ReceiptRecordJpaRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.ArrayList;
import java.util.List;
import java.util.Map;

@Service
@Transactional(readOnly = true)
@RequiredArgsConstructor
@Slf4j
public class ReceiptRecordService {

    private final ReceiptRecordJpaRepository repository;

    public List<ReceiptRecord> search(String month, String type, String submitter) {
        return repository.findByMonthAndTypeAndSubmitter(month, type, submitter);
    }

    public List<String> getSubmittersByMonth(String month) {
        return repository.findDistinctSubmittersByMonth(month);
    }

    @Transactional
    public List<ReceiptRecord> batchSave(List<Map<String, Object>> payload) {
        List<ReceiptRecord> saved = new ArrayList<>();

        for (Map<String, Object> row : payload) {
            String rowState = toStr(row.get("_rowState"));
            log.debug("batchSave row: _rowState={}, id={}", rowState, row.get("id"));

            if ("deleted".equals(rowState)) {
                Long id = toLong(row.get("id"));
                if (id != null) {
                    repository.findById(id).ifPresent(record -> {
                        record.deactivate();
                        repository.save(record);
                    });
                }
                continue;
            }

            ReceiptRecord record;
            Long id = toLong(row.get("id"));
            if (id != null && "updated".equals(rowState)) {
                record = repository.findById(id).orElse(null);
                if (record == null) continue;
                record.update(
                        toStr(row.get("programName")),
                        toStr(row.get("pdName")),
                        toStr(row.get("shootingDate")),
                        toStr(row.get("receiptType")),
                        toStr(row.get("receiptTypeLabel")),
                        toStr(row.get("date")),
                        toStr(row.get("time")),
                        toStr(row.get("location")),
                        toStr(row.get("purpose")),
                        toStr(row.get("detail")),
                        toStr(row.get("user")),
                        toLongVal(row.get("amount")),
                        toStr(row.get("submitter"))
                );
            } else {
                // receiptType NOT NULL — 기본값 'travel' 적용
                String receiptType = toStr(row.get("receiptType"));
                record = ReceiptRecord.create(
                        toStr(row.get("programName")),
                        toStr(row.get("pdName")),
                        toStr(row.get("shootingDate")),
                        receiptType != null ? receiptType : "travel",
                        toStr(row.get("receiptTypeLabel")),
                        toStr(row.get("date")),
                        toStr(row.get("time")),
                        toStr(row.get("location")),
                        toStr(row.get("purpose")),
                        toStr(row.get("detail")),
                        toStr(row.get("user")),
                        toLongVal(row.get("amount")),
                        toStr(row.get("submitter"))
                );
            }
            saved.add(repository.save(record));
        }
        return saved;
    }

    private String toStr(Object obj) {
        if (obj == null) return null;
        String s = obj.toString();
        return s.isEmpty() ? null : s;
    }

    private Long toLong(Object obj) {
        if (obj == null) return null;
        String s = obj.toString().trim();
        // 프론트 임시 ID는 DB 저장 대상이 아님 — skip
        if (s.isEmpty() || s.startsWith("receipt_") || s.startsWith("__new_")) return null;
        try {
            return (long) Double.parseDouble(s);
        } catch (NumberFormatException e) {
            return null;
        }
    }

    private Long toLongVal(Object obj) {
        if (obj == null) return 0L;
        try {
            return (long) Double.parseDouble(obj.toString());
        } catch (NumberFormatException e) {
            return 0L;
        }
    }
}
