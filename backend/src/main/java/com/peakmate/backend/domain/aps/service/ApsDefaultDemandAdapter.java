package com.peakmate.backend.domain.aps.service;

import com.peakmate.core.aps.ApsDemandAdapter;
import com.peakmate.core.aps.DemandItem;
import org.springframework.stereotype.Component;

import java.time.LocalDate;
import java.util.List;

/**
 * 기본 수요 어댑터 (stub).
 * OrderRegistration은 spec/material 기반 제품 식별이라
 * productCode 직접 매핑이 불가하다. v2에서 MasterProduct join 기반으로 설계 예정.
 *
 * 현재는 빈 리스트를 반환한다.
 * 수요 데이터는 UI에서 수동 입력하거나, 프로젝트별 어댑터 구현으로 대체한다.
 */
@Component
public class ApsDefaultDemandAdapter implements ApsDemandAdapter {

    @Override
    public List<DemandItem> loadDemand(LocalDate periodStart, LocalDate periodEnd) {
        // v2에서 OrderRegistration + MasterProduct join으로 DemandItem 변환 구현 예정
        return List.of();
    }
}
