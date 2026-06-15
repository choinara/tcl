package com.peakmate.backend.infra.repository.document;

import com.peakmate.backend.domain.document.entity.DmsDocFile;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface DmsDocFileJpaRepository extends JpaRepository<DmsDocFile, Long> {
    List<DmsDocFile> findByDocumentIdAndIsActiveOrderByCreatedAtDesc(Long documentId, String isActive);
}
