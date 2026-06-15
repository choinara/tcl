package com.peakmate.backend.interfaces.organization.controller;

import com.peakmate.backend.domain.organization.entity.Company;
import com.peakmate.core.common.ApiResponse;
import com.peakmate.backend.interfaces.organization.dto.request.CreateCompanyRequest;
import com.peakmate.backend.interfaces.organization.dto.request.UpdateCompanyRequest;
import com.peakmate.backend.infra.repository.organization.CompanyJpaRepository;
import com.peakmate.core.security.annotation.RequirePermission;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/organization/companies")
@RequiredArgsConstructor
public class CompanyController {

    private final CompanyJpaRepository companyJpaRepository;

    @RequirePermission(menu = "UM0030", action = "read")
    @GetMapping
    public ApiResponse<Map<String, Object>> findAll(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "2000") int size,
            @RequestParam(required = false) String keyword) {
        List<Company> all = companyJpaRepository.findAllByOrderByIdAsc();
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
        List<Company> all = companyJpaRepository.findByIsActiveOrderByIdAsc("Y");
        return ApiResponse.success(all.stream().map(this::toMap).collect(Collectors.toList()));
    }

    @RequirePermission(menu = "UM0030", action = "create")
    @PostMapping
    public ApiResponse<Map<String, Object>> create(@Valid @RequestBody CreateCompanyRequest request) {
        if (companyJpaRepository.findByCompanyCode(request.companyCode()).isPresent()) {
            return ApiResponse.error("COM002", "이미 사용중인 회사코드입니다.");
        }

        Company company = Company.create(
                request.companyCode(),
                request.companyName(),
                request.companyType(),
                request.parentId(),
                request.country(),
                request.address(),
                request.phone(),
                request.fax(),
                request.ceoName(),
                request.businessNumber()
        );
        Company saved = companyJpaRepository.save(company);
        return ApiResponse.success(toMap(saved));
    }

    @RequirePermission(menu = "UM0030", action = "update")
    @PutMapping("/{id}")
    public ApiResponse<Map<String, Object>> update(@PathVariable Long id, @Valid @RequestBody UpdateCompanyRequest request) {
        Company company = companyJpaRepository.findById(id).orElse(null);
        if (company == null) return ApiResponse.error("COMP001", "회사를 찾을 수 없습니다.");

        company.update(
                request.companyName() != null ? request.companyName() : company.getCompanyName(),
                request.companyType() != null ? request.companyType() : company.getCompanyType(),
                request.parentId() != null ? request.parentId() : company.getParentId(),
                request.country() != null ? request.country() : company.getCountry(),
                request.address() != null ? request.address() : company.getAddress(),
                request.phone() != null ? request.phone() : company.getPhone(),
                request.fax() != null ? request.fax() : company.getFax(),
                request.ceoName() != null ? request.ceoName() : company.getCeoName(),
                request.businessNumber() != null ? request.businessNumber() : company.getBusinessNumber(),
                request.isActive() != null ? (request.isActive() ? "Y" : "N") : company.getIsActive()
        );
        Company saved = companyJpaRepository.save(company);
        return ApiResponse.success(toMap(saved));
    }

    @RequirePermission(menu = "UM0030", action = "delete")
    @DeleteMapping("/{id}")
    public ApiResponse<Void> delete(@PathVariable Long id) {
        companyJpaRepository.deleteById(id);
        return ApiResponse.success("삭제되었습니다");
    }

    private Map<String, Object> toMap(Company c) {
        Map<String, Object> map = new LinkedHashMap<>();
        map.put("id", c.getId());
        map.put("companyCode", c.getCompanyCode());
        map.put("companyName", c.getCompanyName());
        map.put("companyType", c.getCompanyType());
        map.put("parentId", c.getParentId());
        map.put("country", c.getCountry());
        map.put("address", c.getAddress());
        map.put("phone", c.getPhone());
        map.put("fax", c.getFax());
        map.put("ceoName", c.getCeoName());
        map.put("businessNumber", c.getBusinessNumber());
        map.put("isActive", "Y".equals(c.getIsActive()));
        return map;
    }
}
