package com.peakmate.backend.infra.repository.commoncode;

import com.peakmate.backend.domain.commoncode.entity.CommonCodeGroup;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

/**
 * CommonCodeGroup Spring Data JPA Repository.
 * CommonCodeRepositoryImpl에서 단순 CRUD 위임에 사용됩니다.
 */
public interface CommonCodeGroupJpaRepository extends JpaRepository<CommonCodeGroup, Long> {
    Optional<CommonCodeGroup> findByGroupCode(String groupCode);
}
