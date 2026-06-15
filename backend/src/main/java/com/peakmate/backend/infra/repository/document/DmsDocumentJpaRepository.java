package com.peakmate.backend.infra.repository.document;

import com.peakmate.backend.domain.document.entity.DmsDocument;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface DmsDocumentJpaRepository extends JpaRepository<DmsDocument, Long> {
    List<DmsDocument> findByCategoryAndIsActiveOrderByIdDesc(String category, String isActive);
    List<DmsDocument> findByCategoryAndTitleContainingAndIsActiveOrderByIdDesc(String category, String keyword, String isActive);
    List<DmsDocument> findByCategoryAndIsTemplateAndIsActiveOrderByIdDesc(String category, Boolean isTemplate, String isActive);
}
