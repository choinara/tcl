package com.peakmate.backend.infra.repository.organization;

import com.peakmate.backend.domain.organization.entity.Position;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface PositionJpaRepository extends JpaRepository<Position, Long> {
    List<Position> findAllByOrderBySortOrderAsc();
    List<Position> findByIsActiveOrderBySortOrderAsc(String isActive);
    Optional<Position> findByPositionCode(String positionCode);
}
