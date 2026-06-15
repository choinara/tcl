package com.peakmate.backend.infra.repository.preference;

import com.peakmate.backend.domain.preference.entity.UserPreference;
import com.peakmate.backend.domain.preference.repository.UserPreferenceRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Repository;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Optional;

@Repository
@RequiredArgsConstructor
public class UserPreferenceRepositoryImpl implements UserPreferenceRepository {

    private final UserPreferenceJpaRepository userPreferenceJpaRepository;

    @Override
    public List<UserPreference> findByAdminUserId(Long adminUserId) {
        return userPreferenceJpaRepository.findByAdminUserId(adminUserId);
    }

    @Override
    public Optional<UserPreference> findByAdminUserIdAndPrefKey(Long adminUserId, String prefKey) {
        return userPreferenceJpaRepository.findByAdminUserIdAndPrefKey(adminUserId, prefKey);
    }

    @Override
    public UserPreference save(UserPreference entity) {
        return userPreferenceJpaRepository.save(entity);
    }

    @Override
    @Transactional
    public void deleteByAdminUserIdAndPrefKey(Long adminUserId, String prefKey) {
        userPreferenceJpaRepository.deleteByAdminUserIdAndPrefKey(adminUserId, prefKey);
    }
}
