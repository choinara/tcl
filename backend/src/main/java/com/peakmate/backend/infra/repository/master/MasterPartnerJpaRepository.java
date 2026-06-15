package com.peakmate.backend.infra.repository.master;

import com.peakmate.backend.domain.master.entity.MasterPartner;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface MasterPartnerJpaRepository extends JpaRepository<MasterPartner, Long> {
    List<MasterPartner> findAllByOrderByIdAsc();
    List<MasterPartner> findByIsActiveOrderByIdAsc(String isActive);
    Optional<MasterPartner> findByPartnerCode(String partnerCode);
}
