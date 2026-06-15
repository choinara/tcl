package com.peakmate.backend.domain.aps.service;

import com.peakmate.backend.infra.repository.aps.ApsTaktTimeMasterJpaRepository;
import com.peakmate.core.aps.ApsTaktTimeAdapter;
import com.peakmate.core.aps.TaktTimeDto;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Component;

import java.util.List;

/**
 * 기본 Takt time 어댑터.
 * aps_takt_time_master 테이블에서 직접 조회한다.
 */
@Component
@RequiredArgsConstructor
public class ApsDefaultTaktTimeAdapter implements ApsTaktTimeAdapter {

    private final ApsTaktTimeMasterJpaRepository taktTimeRepository;

    @Override
    public List<TaktTimeDto> loadTaktTime(List<String> lineCodes) {
        return taktTimeRepository
                .findByLineCodeInAndIsActiveOrderByLineCodeAscProductCodeAsc(lineCodes, "Y")
                .stream()
                .map(master -> new TaktTimeDto(
                        master.getLineCode(),
                        master.getProductCode(),
                        master.getTaktTimeMinPerKg(),
                        master.getMinWorkerCount()
                ))
                .toList();
    }
}
