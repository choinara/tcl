package com.peakmate.backend.interfaces.organization.controller;

import com.peakmate.backend.domain.organization.entity.Position;
import com.peakmate.core.common.ApiResponse;
import com.peakmate.backend.interfaces.organization.dto.request.CreatePositionRequest;
import com.peakmate.backend.interfaces.organization.dto.request.UpdatePositionRequest;
import com.peakmate.backend.infra.repository.organization.PositionJpaRepository;
import com.peakmate.core.security.annotation.RequirePermission;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/organization/positions")
@RequiredArgsConstructor
public class PositionController {

    private final PositionJpaRepository positionJpaRepository;

    @RequirePermission(menu = "UM0040", action = "read")
    @GetMapping
    public ApiResponse<Map<String, Object>> findAll(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "2000") int size,
            @RequestParam(required = false) String keyword) {
        List<Position> all = positionJpaRepository.findAllByOrderBySortOrderAsc();
        List<Map<String, Object>> content = all.stream().map(this::toMap).collect(Collectors.toList());

        if (keyword != null && !keyword.isBlank()) {
            String kw = keyword.toLowerCase();
            content = content.stream()
                    .filter(m -> m.values().stream()
                            .anyMatch(v -> v != null && v.toString().toLowerCase().contains(kw)))
                    .collect(Collectors.toList());
        }

        Map<String, Object> response = new LinkedHashMap<>();
        response.put("content", content);
        response.put("totalElements", content.size());
        response.put("totalPages", 1);
        response.put("first", true);
        response.put("last", true);
        return ApiResponse.success(response);
    }

    @GetMapping("/all")
    public ApiResponse<List<Map<String, Object>>> findAllActive() {
        List<Position> all = positionJpaRepository.findByIsActiveOrderBySortOrderAsc("Y");
        return ApiResponse.success(all.stream().map(this::toMap).collect(Collectors.toList()));
    }

    @RequirePermission(menu = "UM0040", action = "create")
    @PostMapping
    public ApiResponse<Map<String, Object>> create(@Valid @RequestBody CreatePositionRequest request) {
        if (positionJpaRepository.findByPositionCode(request.positionCode()).isPresent()) {
            return ApiResponse.error("POS002", "이미 사용중인 직급코드입니다.");
        }

        Position position = Position.create(
                request.positionCode(),
                request.positionName(),
                request.positionLevel() != null ? request.positionLevel() : 1,
                request.sortOrder() != null ? request.sortOrder() : 0
        );
        Position saved = positionJpaRepository.save(position);
        return ApiResponse.success(toMap(saved));
    }

    @RequirePermission(menu = "UM0040", action = "update")
    @PutMapping("/{id}")
    public ApiResponse<Map<String, Object>> update(@PathVariable Long id, @Valid @RequestBody UpdatePositionRequest request) {
        Position position = positionJpaRepository.findById(id).orElse(null);
        if (position == null) return ApiResponse.error("POS001", "직급을 찾을 수 없습니다.");

        position.update(
                request.positionName() != null ? request.positionName() : position.getPositionName(),
                request.positionLevel() != null ? request.positionLevel() : position.getPositionLevel(),
                request.sortOrder() != null ? request.sortOrder() : position.getSortOrder(),
                request.isActive() != null ? (request.isActive() ? "Y" : "N") : position.getIsActive()
        );
        Position saved = positionJpaRepository.save(position);
        return ApiResponse.success(toMap(saved));
    }

    @RequirePermission(menu = "UM0040", action = "delete")
    @DeleteMapping("/{id}")
    public ApiResponse<Void> delete(@PathVariable Long id) {
        positionJpaRepository.deleteById(id);
        return ApiResponse.success("삭제되었습니다");
    }

    private Map<String, Object> toMap(Position p) {
        Map<String, Object> map = new LinkedHashMap<>();
        map.put("id", p.getId());
        map.put("positionCode", p.getPositionCode());
        map.put("positionName", p.getPositionName());
        map.put("positionLevel", p.getPositionLevel());
        map.put("sortOrder", p.getSortOrder());
        map.put("isActive", "Y".equals(p.getIsActive()));
        return map;
    }
}
