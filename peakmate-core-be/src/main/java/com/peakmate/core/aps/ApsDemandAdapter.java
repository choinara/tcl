package com.peakmate.core.aps;

import java.time.LocalDate;
import java.util.List;

/**
 * 수요 데이터 어댑터 인터페이스.
 * 프로젝트별로 수요 소스(수주, MRP 등)에 맞게 구현한다.
 */
public interface ApsDemandAdapter {

    /**
     * 기간 내 수요 데이터를 로드한다.
     *
     * @param periodStart 계획 시작일
     * @param periodEnd   계획 종료일
     * @return 수요 목록
     */
    List<DemandItem> loadDemand(LocalDate periodStart, LocalDate periodEnd);
}
