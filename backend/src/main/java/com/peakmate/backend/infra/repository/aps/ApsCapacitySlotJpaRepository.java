package com.peakmate.backend.infra.repository.aps;

import com.peakmate.backend.domain.aps.entity.ApsCapacitySlot;
import org.springframework.data.jpa.repository.JpaRepository;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;

public interface ApsCapacitySlotJpaRepository extends JpaRepository<ApsCapacitySlot, Long> {

    List<ApsCapacitySlot> findByLineCodeInAndSlotDateBetweenOrderBySlotDateAscLineCodeAsc(
            List<String> lineCodes, LocalDate from, LocalDate to);

    Optional<ApsCapacitySlot> findByLineCodeAndSlotDateAndShift(
            String lineCode, LocalDate slotDate, String shift);

    List<ApsCapacitySlot> findBySlotDateBetweenAndIsActiveOrderBySlotDateAscLineCodeAsc(
            LocalDate from, LocalDate to, String isActive);
}
