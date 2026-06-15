package com.peakmate.backend.infra.repository.organization;

import com.peakmate.backend.domain.organization.entity.Department;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface DepartmentJpaRepository extends JpaRepository<Department, Long> {
    List<Department> findAllByOrderBySortOrderAsc();
    List<Department> findByIsActiveOrderBySortOrderAsc(String isActive);
    Optional<Department> findByDeptCode(String deptCode);
}
