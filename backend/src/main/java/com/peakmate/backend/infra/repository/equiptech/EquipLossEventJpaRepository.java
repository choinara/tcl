package com.peakmate.backend.infra.repository.equiptech;

import com.peakmate.backend.domain.equiptech.entity.EquipLossEvent;
import org.springframework.data.jpa.repository.JpaRepository;

import java.time.LocalDate;
import java.util.List;

public interface EquipLossEventJpaRepository extends JpaRepository<EquipLossEvent, Long> {
    List<EquipLossEvent> findAllByOrderByFailDateDescIdDesc();
    List<EquipLossEvent> findByFailDateBetweenOrderByFailDateDescIdDesc(LocalDate start, LocalDate end);
    List<EquipLossEvent> findByEquipIdOrderByFailDateDescIdDesc(Long equipId);
    List<EquipLossEvent> findByEquipIdAndFailDateBetweenOrderByFailDateDescIdDesc(Long equipId, LocalDate start, LocalDate end);
    List<EquipLossEvent> findByFailDateBetween(LocalDate start, LocalDate end);
    List<EquipLossEvent> findByEquipIdInAndFailDateBetween(List<Long> equipIds, LocalDate start, LocalDate end);
}
