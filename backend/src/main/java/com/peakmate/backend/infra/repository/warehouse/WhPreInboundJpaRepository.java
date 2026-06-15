package com.peakmate.backend.infra.repository.warehouse;

import com.peakmate.backend.domain.warehouse.entity.WhPreInbound;
import org.springframework.data.jpa.repository.JpaRepository;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;

public interface WhPreInboundJpaRepository extends JpaRepository<WhPreInbound, Long> {

    List<WhPreInbound> findAllByOrderByPreInboundDateDescIdDesc();

    List<WhPreInbound> findByPreInboundDateBetweenOrderByPreInboundDateDescIdDesc(LocalDate start, LocalDate end);

    Optional<WhPreInbound> findByLotNo(String lotNo);

    Optional<WhPreInbound> findByBarcodeNo(String barcodeNo);

    long countByBarcodeNoStartingWith(String prefix);
}
