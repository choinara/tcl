package com.peakmate.core.aps;

import java.math.BigDecimal;
import java.time.LocalDate;

/**
 * 가용능력 슬롯 DTO.
 *
 * @param lineCode       호기 코드
 * @param slotDate       일자
 * @param shift          Shift 코드 (APS_SHIFT_TYPE)
 * @param crew           작업조 코드 (APS_CREW_CODE)
 * @param workerCount    작업자 인원
 * @param availHours     가용 시간 (시간)
 * @param availWeightKg  가용 생산 중량 (kg)
 */
public record CapacitySlotDto(
        String lineCode,
        LocalDate slotDate,
        String shift,
        String crew,
        int workerCount,
        BigDecimal availHours,
        BigDecimal availWeightKg
) {}
