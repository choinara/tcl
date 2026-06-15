package com.peakmate.backend.infra.repository.master;

import com.peakmate.backend.domain.master.entity.MasterCustomer;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface MasterCustomerJpaRepository extends JpaRepository<MasterCustomer, Long> {
    List<MasterCustomer> findAllByOrderByIdAsc();
    Optional<MasterCustomer> findByCustomerCode(String customerCode);
}
