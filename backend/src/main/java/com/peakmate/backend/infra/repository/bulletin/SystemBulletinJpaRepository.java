package com.peakmate.backend.infra.repository.bulletin;

import com.peakmate.backend.domain.bulletin.entity.SystemBulletin;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;

import java.util.List;

public interface SystemBulletinJpaRepository extends JpaRepository<SystemBulletin, Long> {

    Page<SystemBulletin> findAllByOrderByCreatedAtDesc(Pageable pageable);

    Page<SystemBulletin> findByIsActiveOrderByCreatedAtDesc(String isActive, Pageable pageable);

    @Query("SELECT b FROM SystemBulletin b WHERE b.isActive = 'Y' AND b.popupOnLogin = 'Y' " +
           "AND (b.validFrom IS NULL OR b.validFrom <= CURRENT_DATE) " +
           "AND (b.validTo IS NULL OR b.validTo >= CURRENT_DATE) " +
           "ORDER BY b.createdAt DESC")
    List<SystemBulletin> findActiveForLoginPopup();
}
