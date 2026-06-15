package com.peakmate.backend.infra.repository.production;

import com.peakmate.backend.domain.production.entity.DailyProductionPlan;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;

public interface DailyProductionPlanJpaRepository extends JpaRepository<DailyProductionPlan, Long> {

    List<DailyProductionPlan> findByPlanYearAndPlanMonthOrderBySortOrderAsc(
            Integer planYear, Integer planMonth);

    @Query("SELECT p FROM DailyProductionPlan p " +
           "WHERE (p.planYear = :y1 AND p.planMonth IN :months1) " +
           "   OR (p.planYear = :y2 AND p.planMonth IN :months2) " +
           "ORDER BY p.sortOrder ASC")
    List<DailyProductionPlan> findByThreeMonths(
            @Param("y1") Integer year1, @Param("months1") List<Integer> months1,
            @Param("y2") Integer year2, @Param("months2") List<Integer> months2);

    void deleteByPlanYearAndPlanMonth(Integer planYear, Integer planMonth);
}
