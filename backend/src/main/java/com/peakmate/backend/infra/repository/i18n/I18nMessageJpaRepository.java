package com.peakmate.backend.infra.repository.i18n;

import com.peakmate.backend.domain.i18n.entity.I18nMessage;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface I18nMessageJpaRepository extends JpaRepository<I18nMessage, Long> {
    List<I18nMessage> findByIsActiveOrderByMessageKeyAsc(String isActive);
    List<I18nMessage> findByLangCodeAndIsActiveOrderByMessageKeyAsc(String langCode, String isActive);
    Optional<I18nMessage> findByLangCodeAndMessageKey(String langCode, String messageKey);
}
