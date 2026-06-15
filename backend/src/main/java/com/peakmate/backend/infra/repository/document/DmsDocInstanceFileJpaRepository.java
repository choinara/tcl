package com.peakmate.backend.infra.repository.document;

import com.peakmate.backend.domain.document.entity.DmsDocInstanceFile;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface DmsDocInstanceFileJpaRepository extends JpaRepository<DmsDocInstanceFile, Long> {

    List<DmsDocInstanceFile> findByInstanceIdAndIsActiveOrderByCreatedAtDesc(Long instanceId, String isActive);
}
