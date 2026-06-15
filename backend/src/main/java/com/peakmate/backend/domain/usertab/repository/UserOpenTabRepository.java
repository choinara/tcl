package com.peakmate.backend.domain.usertab.repository;

import com.peakmate.backend.domain.usertab.entity.UserOpenTab;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;

/**
 * 사용자별 열린 탭 세션 리포지토리.
 */
public interface UserOpenTabRepository extends JpaRepository<UserOpenTab, Long> {

    List<UserOpenTab> findByAdminUserIdOrderBySortOrderAsc(Long adminUserId);

    /**
     * JPQL 직접 DELETE — flush 순서(INSERT→UPDATE→DELETE) 우회.
     * derived delete는 Hibernate가 INSERT 이후 DELETE해 uk_uot_user_path 위반 발생.
     */
    @Modifying
    @Query("DELETE FROM UserOpenTab t WHERE t.adminUserId = :adminUserId")
    void deleteByAdminUserId(@Param("adminUserId") Long adminUserId);
}
