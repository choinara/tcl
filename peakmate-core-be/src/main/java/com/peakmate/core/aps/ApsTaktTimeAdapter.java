package com.peakmate.core.aps;

import java.util.List;

/**
 * Takt time 어댑터 인터페이스.
 */
public interface ApsTaktTimeAdapter {

    /**
     * 대상 호기에 대한 Takt time 마스터를 로드한다.
     *
     * @param lineCodes 대상 호기 코드 목록
     * @return Takt time 목록
     */
    List<TaktTimeDto> loadTaktTime(List<String> lineCodes);
}
