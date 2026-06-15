package com.peakmate.backend.infra.repository.admin;

import com.peakmate.backend.domain.admin.entity.AdminRole;
import com.peakmate.backend.domain.admin.repository.AdminRoleRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
@RequiredArgsConstructor
public class AdminRoleRepositoryImpl implements AdminRoleRepository {

    private final AdminRoleJpaRepository adminRoleJpaRepository;

    @Override
    public Optional<AdminRole> findByRoleCode(String roleCode) {
        return adminRoleJpaRepository.findByRoleCode(roleCode);
    }

    @Override
    public List<AdminRole> findAllByRoleCodeIn(List<String> codes) {
        return adminRoleJpaRepository.findAllByRoleCodeIn(codes);
    }

    @Override
    public List<AdminRole> findAll() {
        return adminRoleJpaRepository.findAll();
    }

    @Override
    public Optional<AdminRole> findById(Long id) {
        return adminRoleJpaRepository.findById(id);
    }

    @Override
    public AdminRole save(AdminRole adminRole) {
        return adminRoleJpaRepository.save(adminRole);
    }

    @Override
    public void deleteById(Long id) {
        adminRoleJpaRepository.deleteById(id);
    }
}
