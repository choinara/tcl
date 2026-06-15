package com.peakmate.backend.interfaces.commoncode.controller;

import com.peakmate.backend.domain.commoncode.entity.CommonCode;
import com.peakmate.backend.domain.commoncode.entity.CommonCodeGroup;
import com.peakmate.backend.domain.commoncode.service.CommonCodeDomainService;
import com.peakmate.backend.domain.commoncode.service.CommonCodeUsageChecker;
import com.peakmate.core.common.ApiResponse;
import com.peakmate.backend.interfaces.commoncode.dto.request.CreateCodeGroupRequest;
import com.peakmate.backend.interfaces.commoncode.dto.request.CreateCodeRequest;
import com.peakmate.backend.interfaces.commoncode.dto.request.UpdateCodeGroupRequest;
import com.peakmate.backend.interfaces.commoncode.dto.request.UpdateCodeRequest;
import com.peakmate.backend.infra.repository.commoncode.CommonCodeGroupJpaRepository;
import com.peakmate.backend.infra.repository.commoncode.CommonCodeJpaRepository;
import com.peakmate.core.security.annotation.RequirePermission;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

/**
 * 공통코드 API Controller
 */
@Slf4j
@RestController
@RequestMapping("/api/common-codes")
@RequiredArgsConstructor
public class CommonCodeController {

    private final CommonCodeDomainService commonCodeDomainService;
    private final CommonCodeJpaRepository commonCodeJpaRepository;
    private final CommonCodeGroupJpaRepository commonCodeGroupJpaRepository;
    private final CommonCodeUsageChecker usageChecker;

    /** 코드 네이밍 규칙: 영문 대문자 + 숫자 + 언더스코어. DTO @Pattern과 일치. */
    private static final java.util.regex.Pattern CODE_PATTERN = java.util.regex.Pattern.compile("^[A-Z0-9_]+$");

    private static void validateCodeFormat(String code) {
        if (code == null || code.isBlank()) return;
        if (!CODE_PATTERN.matcher(code).matches()) {
            throw new IllegalArgumentException(
                    "코드는 영문 대문자, 숫자, 언더스코어(_)만 사용할 수 있습니다. (입력값: " + code + ")");
        }
    }

    // =========================================================================
    // 공통코드 그룹 API
    // =========================================================================

    /**
     * 전체 공통코드 그룹 목록 조회
     */
    @GetMapping("/groups")
    public ApiResponse<List<CommonCodeGroupResponse>> getAllGroups() {
        List<CommonCodeGroup> groups = commonCodeDomainService.getAllGroups();
        return ApiResponse.success(groups.stream().map(CommonCodeGroupResponse::from).toList());
    }

    /**
     * 공통코드 그룹 등록
     */
    @RequirePermission(menu = "SM0090", action = "create")
    @PostMapping("/groups")
    public ApiResponse<CommonCodeGroupResponse> createGroup(@Valid @RequestBody CreateCodeGroupRequest request) {
        if (commonCodeGroupJpaRepository.findByGroupCode(request.groupCode()).isPresent()) {
            return ApiResponse.error("CC002", "이미 사용중인 그룹코드입니다.");
        }

        Integer sortOrder = request.sortOrder() != null ? request.sortOrder() : 0;

        CommonCodeGroup group = CommonCodeGroup.create(request.groupCode(), request.groupName(),
                request.description() != null ? request.description() : "", sortOrder,
                request.extra1Label(), request.extra2Label());
        CommonCodeGroup saved = commonCodeGroupJpaRepository.save(group);
        return ApiResponse.success(CommonCodeGroupResponse.from(saved));
    }

    /**
     * 공통코드 그룹 수정
     */
    @RequirePermission(menu = "SM0090", action = "update")
    @PutMapping("/groups/{id}")
    public ApiResponse<CommonCodeGroupResponse> updateGroup(@PathVariable Long id, @Valid @RequestBody UpdateCodeGroupRequest request) {
        CommonCodeGroup group = commonCodeGroupJpaRepository.findById(id).orElse(null);
        if (group == null) return ApiResponse.error("CC001", "그룹을 찾을 수 없습니다.");

        String groupCode = request.groupCode() != null ? request.groupCode() : group.getGroupCode();
        String groupName = request.groupName() != null ? request.groupName() : group.getGroupName();

        if (!groupCode.equals(group.getGroupCode()) && commonCodeGroupJpaRepository.findByGroupCode(groupCode).isPresent()) {
            return ApiResponse.error("CC002", "이미 사용중인 그룹코드입니다.");
        }

        String description = request.description() != null ? request.description() : group.getDescription();
        String useYn = request.useYn() != null ? request.useYn() : group.getUseYn();
        Integer sortOrder = request.sortOrder() != null ? request.sortOrder() : group.getSortOrder();
        // extra label: 명시적으로 빈 문자열이면 null로 저장 (라벨 제거), 미전달이면 기존값 유지
        String extra1Label = request.extra1Label() != null
                ? (request.extra1Label().isBlank() ? null : request.extra1Label())
                : group.getExtra1Label();
        String extra2Label = request.extra2Label() != null
                ? (request.extra2Label().isBlank() ? null : request.extra2Label())
                : group.getExtra2Label();

        group.update(groupCode, groupName, description, useYn, sortOrder, extra1Label, extra2Label);
        CommonCodeGroup saved = commonCodeGroupJpaRepository.save(group);
        return ApiResponse.success(CommonCodeGroupResponse.from(saved));
    }

    /**
     * 공통코드 그룹 삭제
     */
    @RequirePermission(menu = "SM0090", action = "delete")
    @DeleteMapping("/groups/{id}")
    @org.springframework.cache.annotation.CacheEvict(value = "commonCodes", allEntries = true)
    public ApiResponse<Void> deleteGroup(@PathVariable Long id) {
        commonCodeDomainService.deleteGroup(id);
        return ApiResponse.success("삭제되었습니다");
    }

    // =========================================================================
    // 공통코드 API
    // =========================================================================

    /**
     * 그룹코드별 공통코드 목록 조회
     */
    @GetMapping("/group/{groupCode}")
    public ApiResponse<List<CommonCodeResponse>> getCodesByGroup(@PathVariable String groupCode) {
        List<CommonCode> codes = commonCodeDomainService.getCodesByGroup(groupCode);
        return ApiResponse.success(codes.stream().map(CommonCodeResponse::from).toList());
    }

    /**
     * 그룹ID별 공통코드 목록 조회 (관리 화면용 - useYn 무관 전체)
     */
    @GetMapping("/by-group-id/{groupId}")
    public ApiResponse<List<CommonCodeDetailResponse>> getCodesByGroupId(@PathVariable Long groupId) {
        List<CommonCode> codes = commonCodeJpaRepository.findByGroupIdOrderBySortOrderAsc(groupId);
        return ApiResponse.success(codes.stream().map(CommonCodeDetailResponse::from).toList());
    }

    /**
     * 공통코드 등록
     */
    @RequirePermission(menu = "SM0090", action = "create")
    @PostMapping
    public ApiResponse<CommonCodeDetailResponse> createCode(@Valid @RequestBody CreateCodeRequest request) {
        if (commonCodeJpaRepository.findByGroupIdAndCode(request.groupId(), request.code()).isPresent()) {
            return ApiResponse.error("CC002", "이미 사용중인 코드입니다.");
        }

        Integer sortOrder = request.sortOrder() != null ? request.sortOrder() : 0;

        CommonCode entity = CommonCode.create(request.groupId(), request.code(), request.codeName(),
                request.codeDesc() != null ? request.codeDesc() : "",
                sortOrder,
                request.extra1() != null ? request.extra1() : "",
                request.extra2() != null ? request.extra2() : "");
        CommonCode saved = commonCodeJpaRepository.save(entity);
        return ApiResponse.success(CommonCodeDetailResponse.from(saved));
    }

    /**
     * 공통코드 수정
     */
    @RequirePermission(menu = "SM0090", action = "update")
    @PutMapping("/{id}")
    public ApiResponse<CommonCodeDetailResponse> updateCode(@PathVariable Long id, @Valid @RequestBody UpdateCodeRequest request) {
        CommonCode entity = commonCodeJpaRepository.findById(id).orElse(null);
        if (entity == null) return ApiResponse.error("CC003", "코드를 찾을 수 없습니다.");

        String code = request.code() != null ? request.code() : entity.getCode();
        String codeName = request.codeName() != null ? request.codeName() : entity.getCodeName();

        if (!code.equals(entity.getCode()) && commonCodeJpaRepository.findByGroupIdAndCode(entity.getGroupId(), code).isPresent()) {
            return ApiResponse.error("CC002", "이미 사용중인 코드입니다.");
        }

        String codeDesc = request.codeDesc() != null ? request.codeDesc() : entity.getCodeDesc();
        String useYn = request.useYn() != null ? request.useYn() : entity.getUseYn();
        Integer sortOrder = request.sortOrder() != null ? request.sortOrder() : entity.getSortOrder();
        String extra1 = request.extra1() != null ? request.extra1() : entity.getExtra1();
        String extra2 = request.extra2() != null ? request.extra2() : entity.getExtra2();

        entity.update(code, codeName, codeDesc, useYn, sortOrder, extra1, extra2);
        CommonCode saved = commonCodeJpaRepository.save(entity);
        return ApiResponse.success(CommonCodeDetailResponse.from(saved));
    }

    /**
     * 공통코드 삭제
     */
    @RequirePermission(menu = "SM0090", action = "delete")
    @DeleteMapping("/{id}")
    public ApiResponse<Void> deleteCode(@PathVariable Long id) {
        CommonCode code = commonCodeJpaRepository.findById(id).orElse(null);
        if (code != null) {
            CommonCodeGroup group = commonCodeGroupJpaRepository.findById(code.getGroupId()).orElse(null);
            if (group != null && usageChecker.isCodeInUse(group.getGroupCode(), code.getCode())) {
                throw new IllegalArgumentException(
                        "'" + code.getCodeName() + "' 코드는 사용 중이므로 삭제할 수 없습니다. 사용여부를 'N'으로 변경하세요.");
            }
        }
        commonCodeDomainService.deleteCode(id);
        return ApiResponse.success("삭제되었습니다");
    }

    /**
     * 공통코드 일괄 저장 (PeakEditGrid batch save)
     */
    @RequirePermission(menu = "SM0090", action = "update")
    @PostMapping("/batch/{groupId}")
    @org.springframework.cache.annotation.CacheEvict(value = "commonCodes", allEntries = true)
    public ApiResponse<Void> batchSave(@PathVariable Long groupId, @RequestBody List<Map<String, Object>> rows) {
        for (Map<String, Object> row : rows) {
            String rowState = (String) row.get("_rowState");
            if (rowState == null) continue;

            switch (rowState) {
                case "created" -> {
                    String code = (String) row.getOrDefault("code", "");
                    String codeName = (String) row.getOrDefault("codeName", "");
                    if (code.isBlank() || codeName.isBlank()) continue;
                    validateCodeFormat(code);
                    if (commonCodeJpaRepository.findByGroupIdAndCode(groupId, code).isPresent()) continue;
                    CommonCode entity = CommonCode.create(groupId, code, codeName,
                            (String) row.getOrDefault("codeDesc", ""),
                            row.get("sortOrder") instanceof Number n ? n.intValue() : 0,
                            (String) row.getOrDefault("extra1", ""),
                            (String) row.getOrDefault("extra2", ""));
                    if (row.get("useYn") != null) entity.update(code, codeName,
                            (String) row.getOrDefault("codeDesc", ""),
                            (String) row.get("useYn"),
                            row.get("sortOrder") instanceof Number n ? n.intValue() : 0,
                            (String) row.getOrDefault("extra1", ""),
                            (String) row.getOrDefault("extra2", ""));
                    commonCodeJpaRepository.save(entity);
                }
                case "updated" -> {
                    Object idObj = row.get("id");
                    if (idObj == null) continue;
                    Long id = idObj instanceof Number n ? n.longValue() : Long.parseLong(idObj.toString());
                    CommonCode entity = commonCodeJpaRepository.findById(id).orElse(null);
                    if (entity == null) continue;
                    String updatedCode = (String) row.getOrDefault("code", entity.getCode());
                    validateCodeFormat(updatedCode);
                    entity.update(
                            updatedCode,
                            (String) row.getOrDefault("codeName", entity.getCodeName()),
                            (String) row.getOrDefault("codeDesc", entity.getCodeDesc()),
                            (String) row.getOrDefault("useYn", entity.getUseYn()),
                            row.get("sortOrder") instanceof Number n ? n.intValue() : entity.getSortOrder(),
                            (String) row.getOrDefault("extra1", entity.getExtra1()),
                            (String) row.getOrDefault("extra2", entity.getExtra2()));
                    commonCodeJpaRepository.save(entity);
                }
                case "deleted" -> {
                    Object idObj = row.get("id");
                    if (idObj == null) continue;
                    Long id = idObj instanceof Number n ? n.longValue() : Long.parseLong(idObj.toString());
                    CommonCode code = commonCodeJpaRepository.findById(id).orElse(null);
                    if (code != null) {
                        CommonCodeGroup group = commonCodeGroupJpaRepository.findById(code.getGroupId()).orElse(null);
                        if (group != null && usageChecker.isCodeInUse(group.getGroupCode(), code.getCode())) {
                            throw new IllegalArgumentException(
                                    "'" + code.getCodeName() + "' 코드는 사용 중이므로 삭제할 수 없습니다. 사용여부를 'N'으로 변경하세요.");
                        }
                    }
                    commonCodeJpaRepository.deleteById(id);
                }
            }
        }
        return ApiResponse.success("일괄 저장되었습니다");
    }

    // =========================================================================
    // Response DTOs
    // =========================================================================

    public record CommonCodeResponse(String code, String codeName, String codeDesc, String extra1, String extra2) {
        public static CommonCodeResponse from(CommonCode e) {
            return new CommonCodeResponse(e.getCode(), e.getCodeName(), e.getCodeDesc(), e.getExtra1(), e.getExtra2());
        }
    }

    public record CommonCodeDetailResponse(Long id, Long groupId, String code, String codeName, String codeDesc,
                                            String useYn, Integer sortOrder, String extra1, String extra2) {
        public static CommonCodeDetailResponse from(CommonCode e) {
            return new CommonCodeDetailResponse(e.getId(), e.getGroupId(), e.getCode(), e.getCodeName(),
                    e.getCodeDesc(), e.getUseYn(), e.getSortOrder(), e.getExtra1(), e.getExtra2());
        }
    }

    public record CommonCodeGroupResponse(Long id, String groupCode, String groupName, String description,
                                           String useYn, Integer sortOrder,
                                           String extra1Label, String extra2Label) {
        public static CommonCodeGroupResponse from(CommonCodeGroup e) {
            return new CommonCodeGroupResponse(e.getId(), e.getGroupCode(), e.getGroupName(),
                    e.getDescription(), e.getUseYn(), e.getSortOrder(),
                    e.getExtra1Label(), e.getExtra2Label());
        }
    }
}
