package com.peakmate.backend.domain.email.repository;

import com.peakmate.backend.domain.email.entity.EmailCustomerMapping;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.Optional;

public interface EmailCustomerMappingRepository extends JpaRepository<EmailCustomerMapping, Long> {

    // 메서드 이름 파싱이 'Or'/'And'를 키워드로 인식하여 필드명 emailOrDomain을 분해하므로 JPQL로 명시
    @Query("SELECT m FROM EmailCustomerMapping m WHERE m.emailOrDomain = :emailOrDomain AND m.mappingType = :mappingType")
    Optional<EmailCustomerMapping> findByEmailOrDomainAndMappingType(@Param("emailOrDomain") String emailOrDomain,
                                                                     @Param("mappingType") String mappingType);
}
