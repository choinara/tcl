package com.peakmate.backend.infra.repository.preference;

import com.peakmate.backend.domain.preference.entity.UserPreference;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.Optional;

public interface UserPreferenceJpaRepository extends JpaRepository<UserPreference, Long> {

    List<UserPreference> findByAdminUserId(Long adminUserId);

    Optional<UserPreference> findByAdminUserIdAndPrefKey(Long adminUserId, String prefKey);

    @Modifying(flushAutomatically = true, clearAutomatically = true)
    @Query("DELETE FROM UserPreference p WHERE p.adminUserId = :adminUserId AND p.prefKey = :prefKey")
    void deleteByAdminUserIdAndPrefKey(@Param("adminUserId") Long adminUserId, @Param("prefKey") String prefKey);
}
