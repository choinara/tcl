package com.peakmate.backend.infra.repository.admin;

import com.peakmate.backend.domain.admin.entity.TeamInfo;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.Optional;

/**
 * 팀 정보 JPA Repository.
 */
public interface TeamInfoJpaRepository extends JpaRepository<TeamInfo, Long> {
    @Query(value = "SELECT * FROM team_info WHERE code = :code", nativeQuery = true)
    Optional<TeamInfo> findByCode(@Param("code") String code);
}
