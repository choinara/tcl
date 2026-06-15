package com.peakmate.backend.infra.repository.aas;

import com.peakmate.backend.domain.aas.entity.AasxFile;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface AasxFileJpaRepository extends JpaRepository<AasxFile, Long> {
    List<AasxFile> findByUseYnOrderByCreatedAtDesc(String useYn);
    Optional<AasxFile> findByFileHash(String fileHash);
}
