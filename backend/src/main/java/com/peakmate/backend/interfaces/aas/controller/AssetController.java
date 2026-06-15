package com.peakmate.backend.interfaces.aas.controller;

import com.peakmate.backend.domain.aas.entity.AssetInstance;
import com.peakmate.backend.domain.aas.entity.AssetType;
import com.peakmate.backend.domain.aas.service.AssetDomainService;
import com.peakmate.core.common.ApiResponse;
import com.peakmate.core.security.annotation.RequirePermission;
import jakarta.validation.Valid;
import jakarta.validation.constraints.NotBlank;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@Slf4j
@RestController
@RequestMapping("/api/aas")
@RequiredArgsConstructor
public class AssetController {

    private final AssetDomainService assetDomainService;

    // =========================================================================
    // Asset Type API (AA0010 — 변경 없음)
    // =========================================================================

    @RequirePermission(menu = "AA0020", action = "read")
    @GetMapping("/asset-types")
    public ApiResponse<List<AssetTypeResponse>> getAllTypes() {
        return ApiResponse.success(assetDomainService.getAllTypes().stream()
                .map(AssetTypeResponse::from).toList());
    }

    @RequirePermission(menu = "AA0020", action = "create")
    @PostMapping("/asset-types")
    public ApiResponse<?> createType(@Valid @RequestBody CreateAssetTypeRequest request) {
        if (assetDomainService.findByTypeCode(request.type_code()).isPresent()) {
            return ApiResponse.error("DUPLICATE_TYPE_CODE", "이미 사용 중인 타입 코드입니다.");
        }
        AssetType type = AssetType.create(
                request.type_code(), request.type_name(), request.shell_id(),
                request.description(), request.field_schema()
        );
        return ApiResponse.success(AssetTypeResponse.from(assetDomainService.saveType(type)));
    }

    @RequirePermission(menu = "AA0020", action = "update")
    @PutMapping("/asset-types/{typeCode}")
    public ApiResponse<?> updateType(@PathVariable String typeCode,
                                     @Valid @RequestBody UpdateAssetTypeRequest request) {
        AssetType type = assetDomainService.findByTypeCode(typeCode).orElse(null);
        if (type == null) return ApiResponse.error("NOT_FOUND", "존재하지 않는 타입 코드입니다.");
        type.update(
                request.type_name() != null ? request.type_name() : type.getTypeName(),
                request.shell_id(), request.description(), request.field_schema()
        );
        return ApiResponse.success(AssetTypeResponse.from(assetDomainService.saveType(type)));
    }

    @RequirePermission(menu = "AA0020", action = "delete")
    @DeleteMapping("/asset-types/{typeCode}")
    public ApiResponse<?> deleteType(@PathVariable String typeCode) {
        if (assetDomainService.findByTypeCode(typeCode).isEmpty()) {
            return ApiResponse.error("NOT_FOUND", "존재하지 않는 타입 코드입니다.");
        }
        try {
            assetDomainService.deleteType(typeCode);
            return ApiResponse.success("삭제되었습니다.");
        } catch (IllegalStateException e) {
            return ApiResponse.error("HAS_INSTANCES", e.getMessage());
        }
    }

    // =========================================================================
    // Asset Instance API (AA0020 — Q6 A안 batch 패턴)
    // =========================================================================

    @RequirePermission(menu = "AA0020", action = "read")
    @GetMapping("/instances")
    public ApiResponse<List<AssetInstanceResponse>> getAllInstances(
            @RequestParam(required = false) String typeCode) {
        List<AssetInstance> instances = typeCode != null && !typeCode.isBlank()
                ? assetDomainService.getInstancesByTypeCode(typeCode)
                : assetDomainService.getAllInstances();
        return ApiResponse.success(instances.stream()
                .map(AssetInstanceResponse::from).toList());
    }

    @RequirePermission(menu = "AA0020", action = "create")
    @PostMapping("/instances")
    public ApiResponse<?> batchSaveInstances(@RequestBody BatchSaveRequest request) {
        // created
        if (request.created() != null) {
            for (CreateAssetInstanceRequest req : request.created()) {
                if (req.instanceId() == null || req.instanceId().isBlank())
                    return ApiResponse.error("VALIDATION", "Asset ID는 필수입니다.");
                if (req.instanceName() == null || req.instanceName().isBlank())
                    return ApiResponse.error("VALIDATION", "이름은 필수입니다.");
                if (req.typeCode() == null || req.typeCode().isBlank())
                    return ApiResponse.error("VALIDATION", "Asset Type은 필수입니다.");
                if (assetDomainService.findByInstanceId(req.instanceId()).isPresent())
                    return ApiResponse.error("DUPLICATE_INSTANCE_ID",
                            "이미 사용 중인 Asset ID입니다: " + req.instanceId());

                // Q3: 기준정보 연결 필수 — BE 강제
                boolean hasLink = req.linkedMenuCode() != null || req.linkedRecordId() != null
                        || (req.linkedColumns() != null && !req.linkedColumns().isEmpty());
                if (!hasLink)
                    return ApiResponse.error("VALIDATION",
                            "[" + req.instanceId() + "] 기준정보 연결이 최소 1개 필요합니다.");

                // link 부분 검증: menuCode/recordId/columns 중 하나라도 있으면 셋 모두 필수
                if (req.linkedMenuCode() == null || req.linkedRecordId() == null
                        || req.linkedColumns() == null || req.linkedColumns().isEmpty())
                    return ApiResponse.error("VALIDATION",
                            "[" + req.instanceId() + "] 기준정보 연결 정보가 불완전합니다.");
                if (req.linkedColumns().size() > 5)
                    return ApiResponse.error("VALIDATION",
                            "[" + req.instanceId() + "] 연결 컬럼은 최대 5개입니다.");

                AssetInstance instance = AssetInstance.create(
                        req.instanceId(), req.instanceName(), req.typeCode(),
                        req.linkedMenuCode(), req.linkedRecordId(), req.linkedColumns()
                );
                assetDomainService.saveInstance(instance);
            }
        }

        // updated
        if (request.updated() != null) {
            for (UpdateAssetInstanceRequest req : request.updated()) {
                if (req.id() == null)
                    return ApiResponse.error("VALIDATION", "수정 대상 id가 필요합니다.");
                AssetInstance instance = assetDomainService.findInstanceById(req.id())
                        .orElse(null);
                if (instance == null)
                    return ApiResponse.error("NOT_FOUND", "존재하지 않는 인스턴스입니다: " + req.id());
                instance.update(req.instanceName(), req.typeCode(),
                        req.locationFloor(), req.serialNumber());
                assetDomainService.saveInstance(instance);
            }
        }

        // deleted
        if (request.deleted() != null) {
            for (Long id : request.deleted()) {
                assetDomainService.deleteInstanceById(id);
            }
        }

        return ApiResponse.success("저장되었습니다.");
    }

    @RequirePermission(menu = "AA0020", action = "update")
    @PostMapping("/instances/{id}/link")
    public ApiResponse<?> linkInstance(@PathVariable Long id,
                                       @RequestBody LinkAssetInstanceRequest request) {
        if (request.menuCode() == null || request.menuCode().isBlank())
            return ApiResponse.error("VALIDATION", "menuCode는 필수입니다.");
        if (request.recordId() == null)
            return ApiResponse.error("VALIDATION", "recordId는 필수입니다.");
        if (request.columns() == null || request.columns().isEmpty())
            return ApiResponse.error("VALIDATION", "연결 컬럼이 최소 1개 필요합니다.");
        if (request.columns().size() > 5)
            return ApiResponse.error("VALIDATION", "연결 컬럼은 최대 5개입니다.");

        AssetInstance instance = assetDomainService.linkToMaster(
                id, request.menuCode(), request.recordId(), request.columns());
        return ApiResponse.success(AssetInstanceResponse.from(instance));
    }

    @RequirePermission(menu = "AA0020", action = "update")
    @DeleteMapping("/instances/{id}/link")
    public ApiResponse<?> unlinkInstance(@PathVariable Long id) {
        AssetInstance instance = assetDomainService.unlinkFromMaster(id);
        return ApiResponse.success(AssetInstanceResponse.from(instance));
    }

    // =========================================================================
    // Request / Response DTOs
    // =========================================================================

    public record CreateAssetTypeRequest(
            @NotBlank String type_code,
            @NotBlank String type_name,
            String shell_id,
            String description,
            List<Map<String, String>> field_schema
    ) {}

    public record UpdateAssetTypeRequest(
            String type_name,
            String shell_id,
            String description,
            List<Map<String, String>> field_schema
    ) {}

    public record BatchSaveRequest(
            List<CreateAssetInstanceRequest> created,
            List<UpdateAssetInstanceRequest> updated,
            List<Long> deleted
    ) {}

    // Q6 A안: 신규 생성 시 link 정보 포함
    public record CreateAssetInstanceRequest(
            @NotBlank String instanceId,
            @NotBlank String instanceName,
            @NotBlank String typeCode,
            String locationFloor,
            String serialNumber,
            String linkedMenuCode,
            Long linkedRecordId,
            List<AssetInstance.LinkedColumnEntry> linkedColumns
    ) {}

    public record UpdateAssetInstanceRequest(
            Long id,
            String instanceId,
            String instanceName,
            String typeCode,
            String locationFloor,
            String serialNumber
    ) {}

    public record LinkAssetInstanceRequest(
            String menuCode,
            Long recordId,
            List<AssetInstance.LinkedColumnEntry> columns
    ) {}

    public record AssetTypeResponse(
            Long id,
            String type_code,
            String type_name,
            String shell_id,
            String description,
            List<Map<String, String>> field_schema
    ) {
        public static AssetTypeResponse from(AssetType e) {
            return new AssetTypeResponse(
                    e.getId(), e.getTypeCode(), e.getTypeName(),
                    e.getShellId(), e.getDescription(), e.getFieldSchema()
            );
        }
    }

    public record AssetInstanceResponse(
            Long id,
            String instance_id,
            String instance_name,
            String type_code,
            String location_floor,
            String serial_number,
            String status,
            String use_yn,
            String linked_menu_code,
            Long linked_record_id,
            String link_status,
            List<AssetInstance.LinkedColumnEntry> linked_columns
    ) {
        public static AssetInstanceResponse from(AssetInstance e) {
            return new AssetInstanceResponse(
                    e.getId(), e.getInstanceId(), e.getInstanceName(),
                    e.getTypeCode(), e.getLocationFloor(), e.getSerialNumber(),
                    e.getStatus(), e.getUseYn(),
                    e.getLinkedMenuCode(), e.getLinkedRecordId(),
                    e.getLinkStatus(), e.getLinkedColumns()
            );
        }
    }
}
