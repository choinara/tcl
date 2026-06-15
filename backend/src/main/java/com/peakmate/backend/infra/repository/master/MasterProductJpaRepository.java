package com.peakmate.backend.infra.repository.master;

import com.peakmate.backend.domain.master.entity.MasterProduct;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface MasterProductJpaRepository extends JpaRepository<MasterProduct, Long> {
    List<MasterProduct> findAllByOrderByIdAsc();
    Optional<MasterProduct> findByModelNameAndCustomerName(String modelName, String customerName);
}
