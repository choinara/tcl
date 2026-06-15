package com.peakmate.backend.infra.repository.master;

import com.peakmate.backend.domain.master.entity.MasterStandardTime;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface MasterStandardTimeJpaRepository extends JpaRepository<MasterStandardTime, Long> {
    List<MasterStandardTime> findAllByOrderByIdAsc();
}
