package com.peakmate.backend.infra.repository.aas;

import com.peakmate.backend.domain.aas.entity.OpcuaBatchPending;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;

import org.springframework.data.repository.query.Param;

import java.time.LocalDateTime;
import java.util.List;

public interface OpcuaBatchPendingJpaRepository extends JpaRepository<OpcuaBatchPending, Long> {
    List<OpcuaBatchPending> findTop50ByStatusOrderByCreatedAtAsc(String status);
    List<OpcuaBatchPending> findByStatusAndCreatedAtBefore(String status, LocalDateTime before);

    @Query("SELECT p.status, COUNT(p) FROM OpcuaBatchPending p GROUP BY p.status")
    List<Object[]> countByStatusGrouped();

    Page<OpcuaBatchPending> findByStatusInOrderByCreatedAtDesc(List<String> statuses, Pageable pageable);

    @Modifying
    @Query("DELETE FROM OpcuaBatchPending p WHERE p.status = 'DEAD'")
    int deleteAllDead();

    @Modifying
    @Query("DELETE FROM OpcuaBatchPending p WHERE p.status = :status AND p.updatedAt < :before")
    int deleteByStatusAndUpdatedAtBefore(@Param("status") String status, @Param("before") LocalDateTime before);

    @Query("SELECT COUNT(p) FROM OpcuaBatchPending p WHERE p.status = 'DEAD'")
    long countDead();
}
