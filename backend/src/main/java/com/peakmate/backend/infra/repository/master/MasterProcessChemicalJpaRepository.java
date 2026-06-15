package com.peakmate.backend.infra.repository.master;

import com.peakmate.backend.domain.master.entity.MasterProcessChemical;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface MasterProcessChemicalJpaRepository extends JpaRepository<MasterProcessChemical, Long> {
    List<MasterProcessChemical> findAllByOrderByIdAsc();
}
