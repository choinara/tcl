package com.peakmate.backend.infra.repository.admin;

import com.peakmate.backend.domain.admin.entity.AdminRole;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface AdminRoleJpaRepository extends JpaRepository<AdminRole, Long> {
    Optional<AdminRole> findByRoleCode(String roleCode);

    List<AdminRole> findAllByRoleCodeIn(List<String> codes);

    List<AdminRole> findAll();
}
