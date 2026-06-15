package com.peakmate.backend.infra.repository.commoncode;

import com.peakmate.backend.domain.commoncode.entity.CommonCode;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.Optional;

/**
 * CommonCode Spring Data JPA Repository.
 */
public interface CommonCodeJpaRepository extends JpaRepository<CommonCode, Long> {
    List<CommonCode> findByGroupIdOrderBySortOrderAsc(Long groupId);
    long countByGroupId(Long groupId);

    @Modifying(flushAutomatically = true, clearAutomatically = true)
    @Query("DELETE FROM CommonCode c WHERE c.groupId = :groupId")
    void deleteByGroupId(@Param("groupId") Long groupId);

    Optional<CommonCode> findByGroupIdAndCode(Long groupId, String code);
}
