package com.peakmate.backend.infra.repository.aps;

import com.peakmate.backend.domain.aps.entity.ApsTaktTimeMaster;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface ApsTaktTimeMasterJpaRepository extends JpaRepository<ApsTaktTimeMaster, Long> {

    List<ApsTaktTimeMaster> findByLineCodeInAndIsActiveOrderByLineCodeAscProductCodeAsc(
            List<String> lineCodes, String isActive);

    Optional<ApsTaktTimeMaster> findByLineCodeAndProductCode(
            String lineCode, String productCode);

    List<ApsTaktTimeMaster> findByIsActiveOrderByLineCodeAscProductCodeAsc(String isActive);
}
