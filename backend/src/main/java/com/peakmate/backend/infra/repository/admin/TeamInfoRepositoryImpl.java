package com.peakmate.backend.infra.repository.admin;

import com.peakmate.backend.domain.admin.entity.TeamInfo;
import com.peakmate.backend.domain.admin.repository.TeamInfoRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
@RequiredArgsConstructor
public class TeamInfoRepositoryImpl implements TeamInfoRepository {

    private final TeamInfoJpaRepository teamInfoJpaRepository;

    @Override
    public Optional<TeamInfo> findById(Long id) {
        return teamInfoJpaRepository.findById(id);
    }
}
