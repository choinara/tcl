package com.peakmate.core.aps;

import java.util.List;

/**
 * APS 제약 조건 플러그인 인터페이스.
 * 프로젝트별로 구현체를 주입하여 도메인 특화 제약을 추가한다.
 */
public interface ApsConstraintPlugin {

    /**
     * 제약 유형 식별자 (예: "PLATING_BATH", "PAIR_LINE")
     */
    String getConstraintType();

    /**
     * 제약 검증을 수행한다.
     *
     * @param demands       실행 가능 수요 목록
     * @param capacitySlots 가용능력 슬롯 목록
     * @param taktTimes     Takt time 마스터 목록
     * @return 위반 목록 (빈 리스트면 통과)
     */
    List<ConstraintViolation> evaluate(
            List<DemandItem> demands,
            List<CapacitySlotDto> capacitySlots,
            List<TaktTimeDto> taktTimes
    );
}
