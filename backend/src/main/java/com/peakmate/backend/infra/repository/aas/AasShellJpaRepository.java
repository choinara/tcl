package com.peakmate.backend.infra.repository.aas;

import com.peakmate.backend.domain.aas.entity.AasShell;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface AasShellJpaRepository extends JpaRepository<AasShell, Long> {
    List<AasShell> findByAasxFileId(Long aasxFileId);
    void deleteByAasxFileId(Long aasxFileId);
}
