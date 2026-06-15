package com.peakmate.backend.infra.repository.log;

import com.peakmate.backend.domain.log.entity.SystemLog;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

public interface SystemLogJpaRepository extends JpaRepository<SystemLog, Long> {

    @Query("SELECT l FROM SystemLog l WHERE " +
           "(:keyword IS NULL OR :keyword = '' OR " +
           "LOWER(l.username) LIKE LOWER(CONCAT('%', :keyword, '%')) OR " +
           "LOWER(l.action) LIKE LOWER(CONCAT('%', :keyword, '%')) OR " +
           "LOWER(l.detail) LIKE LOWER(CONCAT('%', :keyword, '%')) OR " +
           "LOWER(l.logType) LIKE LOWER(CONCAT('%', :keyword, '%')))")
    Page<SystemLog> findByKeyword(@Param("keyword") String keyword, Pageable pageable);

    @Query("SELECT l FROM SystemLog l WHERE " +
           "l.logType = :logType AND " +
           "(:keyword IS NULL OR :keyword = '' OR " +
           "LOWER(l.username) LIKE LOWER(CONCAT('%', :keyword, '%')) OR " +
           "LOWER(l.action) LIKE LOWER(CONCAT('%', :keyword, '%')) OR " +
           "LOWER(l.detail) LIKE LOWER(CONCAT('%', :keyword, '%')))")
    Page<SystemLog> findByLogTypeAndKeyword(@Param("logType") String logType, @Param("keyword") String keyword, Pageable pageable);
}
