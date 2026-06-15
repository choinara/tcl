package com.peakmate.backend.interfaces.production.controller;

import com.peakmate.backend.domain.production.entity.OrderRegistration;
import com.peakmate.core.common.ApiResponse;
import com.peakmate.backend.infra.repository.production.OrderRegistrationJpaRepository;
import com.peakmate.core.security.annotation.RequirePermission;
import com.peakmate.backend.interfaces.production.dto.request.SaveOrderRequest;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.*;

import java.util.*;

@Slf4j
@RestController
@RequestMapping("/api/production/orders")
@RequiredArgsConstructor
public class OrderRegistrationController {

    private final OrderRegistrationJpaRepository orderRepo;

    /**
     * 월별 수주 데이터 조회
     */
    @RequirePermission(menu = "PM0020", action = "read")
    @GetMapping
    public ApiResponse<Map<String, Object>> list(
            @RequestParam Integer year,
            @RequestParam Integer month) {

        List<OrderRegistration> entities =
                orderRepo.findByOrderYearAndOrderMonthOrderBySortOrderAsc(year, month);

        List<Map<String, Object>> content = entities.stream().map(this::toMap).toList();

        Map<String, Object> response = new LinkedHashMap<>();
        response.put("content", content);
        response.put("totalElements", content.size());
        return ApiResponse.success(response);
    }

    /**
     * 수주 데이터 일괄 저장 (전체 교체: 기존 월 데이터 삭제 → 신규 등록)
     * 화면에 보이는 데이터가 곧 DB 데이터가 됨
     */
    @RequirePermission(menu = "PM0020", action = "create")
    @PostMapping
    @Transactional
    public ApiResponse<Map<String, Object>> save(@Valid @RequestBody SaveOrderRequest request) {
        int year = request.year();
        int month = request.month();

        // 기존 월 데이터 전체 삭제
        orderRepo.deleteByOrderYearAndOrderMonth(year, month);
        orderRepo.flush();

        // 신규 등록 (화면 순서 유지)
        int savedCount = 0;
        for (SaveOrderRequest.OrderRowDto dto : request.rows()) {
            OrderRegistration entity = OrderRegistration.create(
                    year, month, dto.polarity(), dto.site(),
                    dto.spec(), dto.material(), dto.category(), dto.status(), savedCount);

            // 일별 수량 적용
            if (dto.quantities() != null) {
                for (int d = 1; d <= 31; d++) {
                    Integer val = dto.quantities().get("d" + d);
                    entity.setDay(d, val);
                }
            }

            orderRepo.save(entity);
            savedCount++;
        }

        Map<String, Object> result = new LinkedHashMap<>();
        result.put("savedCount", savedCount);
        return ApiResponse.success(result, savedCount + "건이 저장되었습니다.");
    }

    /**
     * 월별 수주 데이터 전체 삭제
     */
    @RequirePermission(menu = "PM0020", action = "delete")
    @DeleteMapping
    @Transactional
    public ApiResponse<Void> deleteByMonth(
            @RequestParam Integer year,
            @RequestParam Integer month,
            @RequestParam(required = false) String polarity) {
        if (polarity != null && !polarity.isBlank()) {
            orderRepo.deleteByOrderYearAndOrderMonthAndPolarity(year, month, polarity);
            return ApiResponse.success(year + "년 " + month + "월 " + polarity + " 데이터가 삭제되었습니다.");
        }
        orderRepo.deleteByOrderYearAndOrderMonth(year, month);
        return ApiResponse.success(year + "년 " + month + "월 데이터가 삭제되었습니다.");
    }

    /**
     * 단건 삭제
     */
    @RequirePermission(menu = "PM0020", action = "delete")
    @DeleteMapping("/{id}")
    public ApiResponse<Void> delete(@PathVariable Long id) {
        orderRepo.deleteById(id);
        return ApiResponse.success("삭제되었습니다");
    }

    private Map<String, Object> toMap(OrderRegistration o) {
        Map<String, Object> map = new LinkedHashMap<>();
        map.put("id", o.getId());
        map.put("polarity", o.getPolarity());
        map.put("site", o.getSite());
        map.put("spec", o.getSpec());
        map.put("material", o.getMaterial());
        map.put("category", o.getCategory());
        map.put("status", o.getStatus());

        Map<String, Integer> quantities = new LinkedHashMap<>();
        for (int d = 1; d <= 31; d++) {
            Integer val = o.getDay(d);
            if (val != null) quantities.put("d" + d, val);
        }
        map.put("quantities", quantities);
        return map;
    }
}
