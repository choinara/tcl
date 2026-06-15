package com.peakmate.core.aps;

import java.time.LocalDate;
import java.util.List;

/**
 * 호기 가용능력 어댑터 인터페이스.
 */
public interface ApsCapacityAdapter {

    /**
     * 대상 호기/기간에 대한 가용능력 슬롯을 로드한다.
     *
     * @param lineCodes   대상 호기 코드 목록
     * @param periodStart 시작일
     * @param periodEnd   종료일
     * @return 가용능력 슬롯 목록
     */
    List<CapacitySlotDto> loadCapacity(List<String> lineCodes, LocalDate periodStart, LocalDate periodEnd);
}
