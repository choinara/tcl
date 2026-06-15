package com.peakmate.backend.infra.repository.organization;

import com.peakmate.backend.domain.organization.entity.Company;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface CompanyJpaRepository extends JpaRepository<Company, Long> {
    List<Company> findAllByOrderByIdAsc();
    List<Company> findByIsActiveOrderByIdAsc(String isActive);
    Optional<Company> findByCompanyCode(String companyCode);
}
