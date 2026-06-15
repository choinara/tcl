package com.peakmate.backend.infra.repository.receipt;

import com.peakmate.backend.domain.receipt.entity.ReceiptRecord;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;

public interface ReceiptRecordJpaRepository extends JpaRepository<ReceiptRecord, Long> {

    List<ReceiptRecord> findAllByOrderByIdAsc();

    @Query("SELECT r FROM ReceiptRecord r WHERE r.isActive = 'Y' " +
           "AND SUBSTRING(r.receiptDate, 1, 7) = :month " +
           "AND (:type IS NULL OR r.receiptType = :type) " +
           "AND (:submitter IS NULL OR r.submitter = :submitter) " +
           "ORDER BY r.receiptDate, r.receiptTime")
    List<ReceiptRecord> findByMonthAndTypeAndSubmitter(
        @Param("month") String month,
        @Param("type") String type,
        @Param("submitter") String submitter);

    @Query("SELECT DISTINCT r.submitter FROM ReceiptRecord r WHERE r.isActive = 'Y' " +
           "AND SUBSTRING(r.receiptDate, 1, 7) = :month " +
           "AND r.submitter IS NOT NULL " +
           "ORDER BY r.submitter")
    List<String> findDistinctSubmittersByMonth(@Param("month") String month);
}
