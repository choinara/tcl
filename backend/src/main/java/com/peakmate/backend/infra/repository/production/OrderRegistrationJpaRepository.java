package com.peakmate.backend.infra.repository.production;

import com.peakmate.backend.domain.production.entity.OrderRegistration;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface OrderRegistrationJpaRepository extends JpaRepository<OrderRegistration, Long> {

    List<OrderRegistration> findByOrderYearAndOrderMonthOrderBySortOrderAsc(
            Integer orderYear, Integer orderMonth);

    Optional<OrderRegistration> findByOrderYearAndOrderMonthAndPolarityAndSiteAndSpecAndMaterial(
            Integer orderYear, Integer orderMonth, String polarity, String site, String spec, String material);

    void deleteByOrderYearAndOrderMonth(Integer orderYear, Integer orderMonth);

    void deleteByOrderYearAndOrderMonthAndPolarity(Integer orderYear, Integer orderMonth, String polarity);
}
