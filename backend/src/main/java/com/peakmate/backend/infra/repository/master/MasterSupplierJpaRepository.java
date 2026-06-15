package com.peakmate.backend.infra.repository.master;

import com.peakmate.backend.domain.master.entity.MasterSupplier;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface MasterSupplierJpaRepository extends JpaRepository<MasterSupplier, Long> {
    List<MasterSupplier> findAllByOrderByIdAsc();
    Optional<MasterSupplier> findBySupplierCode(String supplierCode);
}
