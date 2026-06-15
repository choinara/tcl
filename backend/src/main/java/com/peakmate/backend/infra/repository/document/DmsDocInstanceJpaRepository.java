package com.peakmate.backend.infra.repository.document;

import com.peakmate.backend.domain.document.entity.DmsDocInstance;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;

public interface DmsDocInstanceJpaRepository extends JpaRepository<DmsDocInstance, Long> {

    List<DmsDocInstance> findByTemplateIdAndIsActiveOrderByIdDesc(Long templateId, String isActive);

    List<DmsDocInstance> findByTemplateIdAndStatusAndIsActiveOrderByIdDesc(Long templateId, String status, String isActive);

    @Query("SELECT COUNT(i) FROM DmsDocInstance i WHERE i.isActive = 'Y' AND i.status = :status")
    long countByStatus(@Param("status") String status);

    @Query("SELECT COUNT(i) FROM DmsDocInstance i WHERE i.isActive = 'Y' " +
           "AND i.status NOT IN ('COMPLETED', 'APPROVED') AND i.dueDate < CURRENT_DATE")
    long countOverdue();
}
