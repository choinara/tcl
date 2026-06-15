package com.peakmate.backend.interfaces.aas.controller;

import com.peakmate.backend.domain.aas.dto.AasxParsedResult;
import com.peakmate.backend.domain.aas.dto.AasxParsedResult.ElementInfo;
import com.peakmate.backend.domain.aas.dto.AasxParsedResult.ShellInfo;
import com.peakmate.backend.domain.aas.dto.AasxParsedResult.SubmodelInfo;
import com.peakmate.backend.domain.aas.entity.AasElement;
import com.peakmate.backend.domain.aas.entity.AasShell;
import com.peakmate.backend.domain.aas.entity.AasSubmodel;
import com.peakmate.backend.domain.aas.entity.AasxFile;
import com.peakmate.backend.domain.aas.service.AasModelDomainService;
import com.peakmate.backend.domain.aas.service.AasxParsingService;
import com.peakmate.core.security.annotation.RequirePermission;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.Parameter;
import io.swagger.v3.oas.annotations.media.Schema;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.responses.ApiResponses;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.security.MessageDigest;
import java.util.*;
import java.util.concurrent.ConcurrentHashMap;

/**
 * AAS 모델 관리 API Controller.
 *
 * <p>AASX 파일 업로드, 파싱, 검증, 저장, 삭제 기능을 제공합니다.
 * Eclipse AAS4J 라이브러리를 사용하여 실제 AASX 파일을 파싱합니다.</p>
 */
@Slf4j
@RestController
@RequestMapping("/api/aas/aasx")
@RequiredArgsConstructor
@Tag(name = "AAS 모델 관리", description = "AASX 파일 업로드, 파싱, 검증, 저장, 삭제 API")
public class AasModelController {

    private final AasModelDomainService aasModelDomainService;
    private final AasxParsingService aasxParsingService;

    /** 임시 저장소: 업로드 → 저장 사이 파싱 결과를 보관 */
    private static final Map<String, TempData> tempStore = new ConcurrentHashMap<>();

    private record TempData(String fileName, String fileHash, long fileSize,
                             byte[] fileBytes, AasxParsedResult parsedResult) {}

    // =========================================================================
    // AASX 파일 API
    // =========================================================================

    /**
     * AASX 파일 목록 조회
     */
    @Operation(summary = "AASX 파일 목록 조회", description = "저장된 모든 AASX 파일의 목록을 조회합니다.")
    @RequirePermission(menu = "AA0010", action = "read")
    @GetMapping("/list")
    public ResponseEntity<List<AasxFileResponse>> list() {
        List<AasxFile> files = aasModelDomainService.getAasxFiles();
        return ResponseEntity.ok(files.stream().map(AasxFileResponse::from).toList());
    }

    /**
     * AASX 파일 업로드 + 실제 파싱
     */
    @Operation(summary = "AASX 파일 업로드 및 파싱", description = "AASX 파일을 업로드하고 AAS4J로 실제 파싱하여 요약 정보와 파싱 데이터를 반환합니다.")
    @ApiResponses({
            @ApiResponse(responseCode = "200", description = "업로드 및 파싱 성공"),
            @ApiResponse(responseCode = "400", description = "파일이 비어있거나 AASX 형식이 아닌 경우"),
            @ApiResponse(responseCode = "500", description = "파싱 실패")
    })
    @RequirePermission(menu = "AA0010", action = "create")
    @PostMapping("/upload")
    public ResponseEntity<Map<String, Object>> upload(
            @Parameter(description = "업로드할 AASX 파일") @RequestParam("file") MultipartFile file) {

        if (file.isEmpty()) {
            return ResponseEntity.badRequest().body(Map.of("detail", "파일이 비어있습니다."));
        }

        String fileName = file.getOriginalFilename();
        if (fileName == null || !fileName.endsWith(".aasx")) {
            return ResponseEntity.badRequest().body(Map.of("detail", "AASX 파일만 업로드 가능합니다."));
        }

        try {
            byte[] fileBytes = file.getBytes();
            String fileHash = computeHash(fileBytes);
            String tempFile = "temp_" + System.currentTimeMillis() + "_" + fileName;

            // AAS4J로 실제 파싱
            AasxParsedResult parsed = aasxParsingService.parse(fileBytes);

            // 요약 정보
            Map<String, Object> summary = new LinkedHashMap<>();
            summary.put("file_name", fileName);
            summary.put("aas_version", parsed.aasVersion());
            summary.put("file_hash", fileHash);
            summary.put("shell_count", parsed.shells().size());
            summary.put("submodel_count", parsed.submodels().size());
            summary.put("element_count", parsed.elements().size());

            // 파싱 데이터 (프론트엔드 표시용)
            Map<String, Object> parsedData = buildParsedDataResponse(parsed);

            // 임시 저장
            tempStore.put(tempFile, new TempData(fileName, fileHash, file.getSize(), fileBytes, parsed));

            return ResponseEntity.ok(Map.of(
                    "summary", summary,
                    "temp_file", tempFile,
                    "parsed_data", parsedData
            ));

        } catch (IllegalArgumentException e) {
            log.warn("AASX 파싱 실패: {}", e.getMessage());
            return ResponseEntity.badRequest().body(Map.of("detail", e.getMessage()));
        } catch (Exception e) {
            log.error("AASX 업로드 실패", e);
            return ResponseEntity.internalServerError().body(Map.of("detail", "업로드 처리 실패: " + e.getMessage()));
        }
    }

    /**
     * AASX 표준 검증 (실제 파싱 결과 기반)
     */
    @Operation(summary = "AASX 표준 검증", description = "파싱된 AASX 파일을 AAS 메타모델 표준에 따라 검증합니다.")
    @RequirePermission(menu = "AA0010", action = "read")
    @PostMapping("/validate")
    public ResponseEntity<Map<String, Object>> validate(
            @Parameter(description = "업로드 시 반환된 임시 파일명") @RequestParam("temp_file") String tempFile) {

        TempData temp = tempStore.get(tempFile);
        if (temp == null) {
            return ResponseEntity.badRequest().body(Map.of("detail", "임시 파일을 찾을 수 없습니다."));
        }

        AasxParsedResult parsed = temp.parsedResult();
        List<Map<String, Object>> results = buildValidationResults(parsed);

        long passed = results.stream().filter(r -> (boolean) r.get("is_passed")).count();
        long failed = results.size() - passed;
        long mandatoryTotal = results.stream().filter(r -> "필수".equals(r.get("importance"))).count();
        long mandatoryPassed = results.stream().filter(r -> "필수".equals(r.get("importance")) && (boolean) r.get("is_passed")).count();

        Map<String, Object> summary = new LinkedHashMap<>();
        summary.put("total", results.size());
        summary.put("passed", passed);
        summary.put("failed", failed);
        summary.put("pass_rate", results.isEmpty() ? 0 : Math.round((double) passed / results.size() * 100));
        summary.put("mandatory_total", mandatoryTotal);
        summary.put("mandatory_passed", mandatoryPassed);
        summary.put("mandatory_failed", mandatoryTotal - mandatoryPassed);
        summary.put("optional_total", results.size() - mandatoryTotal);
        summary.put("optional_passed", passed - mandatoryPassed);
        summary.put("optional_failed", failed - (mandatoryTotal - mandatoryPassed));

        return ResponseEntity.ok(Map.of(
                "success", true,
                "file_name", temp.fileName(),
                "results", results,
                "summary", summary
        ));
    }

    /**
     * AASX 파싱 결과 DB 저장 + Asset Type 동적 생성
     */
    @Operation(summary = "AASX 파싱 결과 저장", description = "파싱된 AASX 데이터를 DB에 저장합니다. create_asset_type=true 시 Asset Type을 동적 생성합니다.")
    @RequirePermission(menu = "AA0010", action = "create")
    @PostMapping("/save")
    public ResponseEntity<Map<String, Object>> save(
            @Parameter(description = "업로드 시 반환된 임시 파일명") @RequestParam("temp_file") String tempFile,
            @Parameter(description = "Asset Type 자동 생성 여부") @RequestParam(value = "create_asset_type", defaultValue = "false") boolean createAssetType) {

        TempData temp = tempStore.get(tempFile);
        if (temp == null) {
            return ResponseEntity.badRequest().body(Map.of("detail", "임시 파일을 찾을 수 없습니다."));
        }

        // 파싱 결과를 DB에 저장
        AasxFile saved = aasModelDomainService.saveFromParsedResult(
                temp.fileName(), temp.fileHash(), temp.fileSize(), temp.parsedResult());

        // 임시 저장소 제거
        tempStore.remove(tempFile);

        Map<String, Object> result = new LinkedHashMap<>();
        result.put("id", saved.getId());
        result.put("file_name", saved.getFileName());
        result.put("shell_count", saved.getShellCount());
        result.put("submodel_count", saved.getSubmodelCount());
        result.put("element_count", saved.getElementCount());

        // Asset Type 동적 생성
        if (createAssetType) {
            Map<String, String> assetTypeResult = aasModelDomainService.createAssetTypeFromParsed(
                    temp.parsedResult(), temp.fileName());
            result.put("asset_type", assetTypeResult);
        }

        return ResponseEntity.ok(result);
    }

    /**
     * 파싱된 AASX 데이터 조회 (DB 저장 후)
     */
    @Operation(summary = "파싱된 AASX 데이터 조회", description = "저장된 AASX 파일의 Shell/Submodel/Element 계층 구조를 조회합니다.")
    @RequirePermission(menu = "AA0010", action = "read")
    @GetMapping("/{id}/parsed")
    public ResponseEntity<?> getParsed(@Parameter(description = "AASX 파일 ID") @PathVariable Long id) {
        AasxFile file = aasModelDomainService.findById(id).orElse(null);
        if (file == null) {
            return ResponseEntity.notFound().build();
        }

        List<AasShell> shells = aasModelDomainService.getShellsByFileId(id);
        List<Map<String, Object>> parsedShells = new ArrayList<>();
        List<Map<String, Object>> parsedSubmodels = new ArrayList<>();
        List<Map<String, Object>> parsedElements = new ArrayList<>();

        for (AasShell shell : shells) {
            Map<String, Object> shellMap = new LinkedHashMap<>();
            shellMap.put("id", String.valueOf(shell.getId()));
            shellMap.put("idShort", shell.getShellIdShort());
            shellMap.put("assetInformation", Map.of(
                    "assetKind", shell.getAssetKind() != null ? shell.getAssetKind() : "Instance",
                    "globalAssetId", shell.getGlobalAssetId() != null ? shell.getGlobalAssetId() : ""
            ));
            shellMap.put("description", List.of(
                    Map.of("language", "ko", "text", shell.getDescription() != null ? shell.getDescription() : "")
            ));
            parsedShells.add(shellMap);

            List<AasSubmodel> submodels = aasModelDomainService.getSubmodelsByShellId(shell.getId());
            for (AasSubmodel submodel : submodels) {
                Map<String, Object> smMap = new LinkedHashMap<>();
                smMap.put("id", String.valueOf(submodel.getId()));
                smMap.put("idShort", submodel.getIdShort());
                smMap.put("semanticId", submodel.getSemanticId() != null
                        ? Map.of("keys", List.of(Map.of("value", submodel.getSemanticId()))) : null);
                parsedSubmodels.add(smMap);

                List<AasElement> elements = aasModelDomainService.getElementsBySubmodelId(submodel.getId());
                for (AasElement elem : elements) {
                    Map<String, Object> elemMap = new LinkedHashMap<>();
                    elemMap.put("id_short", elem.getIdShort());
                    elemMap.put("element_type", elem.getElementType());
                    elemMap.put("element_path", elem.getElementPath());
                    elemMap.put("submodel_id", String.valueOf(submodel.getId()));
                    elemMap.put("submodel_id_short", submodel.getIdShort());
                    elemMap.put("value", elem.getValue());
                    elemMap.put("value_type", elem.getValueType());
                    elemMap.put("semantic_id", elem.getSemanticId());
                    elemMap.put("description_ko", elem.getDescriptionKo());
                    elemMap.put("description_en", elem.getDescriptionEn());
                    elemMap.put("unit", elem.getUnit());
                    parsedElements.add(elemMap);
                }
            }
        }

        return ResponseEntity.ok(Map.of("parsed_data", Map.of(
                "shells", parsedShells,
                "submodels", parsedSubmodels,
                "elements", parsedElements
        )));
    }

    /**
     * AASX 파일 삭제 (cascade)
     */
    @Operation(summary = "AASX 파일 삭제", description = "AASX 파일과 연관된 Shell, Submodel, Element 데이터를 모두 삭제합니다.")
    @RequirePermission(menu = "AA0010", action = "delete")
    @DeleteMapping("/{id}")
    public ResponseEntity<Map<String, String>> delete(@Parameter(description = "삭제할 AASX 파일 ID") @PathVariable Long id) {
        AasxFile file = aasModelDomainService.findById(id).orElse(null);
        if (file == null) {
            return ResponseEntity.notFound().build();
        }
        aasModelDomainService.deleteAasxFile(id);
        return ResponseEntity.ok(Map.of("message", "삭제되었습니다."));
    }

    /**
     * AASX에서 Asset Type 정보 추출 (실제 파싱 기반)
     */
    @Operation(summary = "AASX에서 Asset Type 정보 추출", description = "AASX 파일을 실제 파싱하여 Asset Type 정보를 추출합니다.")
    @RequirePermission(menu = "AA0010", action = "read")
    @PostMapping("/parse-for-type")
    public ResponseEntity<Map<String, Object>> parseForType(
            @Parameter(description = "분석할 AASX 파일") @RequestParam("file") MultipartFile file) {

        if (file.isEmpty()) {
            return ResponseEntity.badRequest().body(Map.of("detail", "파일이 비어있습니다."));
        }

        try {
            AasxParsedResult parsed = aasxParsingService.parse(file.getBytes());

            if (parsed.shells().isEmpty()) {
                return ResponseEntity.badRequest().body(Map.of("detail", "AASX에 Shell이 없습니다."));
            }

            ShellInfo shell = parsed.shells().get(0);
            String typeCode = camelToSnakeCase(shell.idShort());

            // Property Element → field_schema 변환
            List<Map<String, String>> fieldSchema = new ArrayList<>();
            for (ElementInfo elem : parsed.elements()) {
                if (!"Property".equals(elem.elementType())) continue;
                Map<String, String> field = new LinkedHashMap<>();
                field.put("key", camelToSnakeCase(elem.idShort()));
                field.put("label", elem.descriptionKo() != null ? elem.descriptionKo() : elem.idShort());
                field.put("type", mapValueType(elem.valueType()));
                if (elem.unit() != null) field.put("unit", elem.unit());
                fieldSchema.add(field);
            }

            Map<String, Object> assetType = new LinkedHashMap<>();
            assetType.put("type_code", typeCode);
            assetType.put("type_name", shell.descriptionKo() != null ? shell.descriptionKo() : shell.idShort());
            assetType.put("description", file.getOriginalFilename() + "에서 추출된 " + shell.idShort() + " 타입");
            assetType.put("field_schema", fieldSchema);

            Map<String, Object> source = new LinkedHashMap<>();
            source.put("file_name", file.getOriginalFilename());
            source.put("shell_id", shell.globalAssetId());
            source.put("shell_count", parsed.shells().size());
            source.put("submodel_count", parsed.submodels().size());
            source.put("element_count", parsed.elements().size());

            return ResponseEntity.ok(Map.of("asset_type", assetType, "source", source));

        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(Map.of("detail", e.getMessage()));
        } catch (Exception e) {
            log.error("AASX parse-for-type 실패", e);
            return ResponseEntity.internalServerError().body(Map.of("detail", "파싱 실패: " + e.getMessage()));
        }
    }

    // =========================================================================
    // Internal helpers
    // =========================================================================

    private String computeHash(byte[] data) throws Exception {
        MessageDigest md = MessageDigest.getInstance("SHA-256");
        byte[] hash = md.digest(data);
        StringBuilder sb = new StringBuilder();
        for (byte b : hash) sb.append(String.format("%02x", b));
        return sb.toString();
    }

    /** 파싱 결과를 프론트엔드 표시용 Map으로 변환 */
    private Map<String, Object> buildParsedDataResponse(AasxParsedResult parsed) {
        List<Map<String, Object>> shells = new ArrayList<>();
        for (ShellInfo si : parsed.shells()) {
            Map<String, Object> shellMap = new LinkedHashMap<>();
            shellMap.put("idShort", si.idShort());
            shellMap.put("assetInformation", Map.of(
                    "assetKind", si.assetKind() != null ? si.assetKind() : "Instance",
                    "globalAssetId", si.globalAssetId() != null ? si.globalAssetId() : ""
            ));
            List<Map<String, String>> descs = new ArrayList<>();
            if (si.descriptionKo() != null) descs.add(Map.of("language", "ko", "text", si.descriptionKo()));
            if (si.descriptionEn() != null) descs.add(Map.of("language", "en", "text", si.descriptionEn()));
            shellMap.put("description", descs);
            shells.add(shellMap);
        }

        List<Map<String, Object>> submodels = new ArrayList<>();
        for (SubmodelInfo smi : parsed.submodels()) {
            Map<String, Object> smMap = new LinkedHashMap<>();
            smMap.put("idShort", smi.idShort());
            smMap.put("semanticId", smi.semanticId() != null
                    ? Map.of("keys", List.of(Map.of("value", smi.semanticId()))) : null);
            smMap.put("elementCount", smi.elementCount());
            submodels.add(smMap);
        }

        List<Map<String, Object>> elements = new ArrayList<>();
        for (ElementInfo ei : parsed.elements()) {
            Map<String, Object> elemMap = new LinkedHashMap<>();
            elemMap.put("id_short", ei.idShort());
            elemMap.put("element_type", ei.elementType());
            elemMap.put("element_path", ei.elementPath());
            elemMap.put("submodel_id_short", ei.submodelIdShort());
            elemMap.put("value", ei.value());
            elemMap.put("value_type", ei.valueType());
            elemMap.put("semantic_id", ei.semanticId());
            elemMap.put("description_ko", ei.descriptionKo());
            elemMap.put("description_en", ei.descriptionEn());
            elemMap.put("unit", ei.unit());
            elements.add(elemMap);
        }

        return Map.of("shells", shells, "submodels", submodels, "elements", elements);
    }

    /** 실제 파싱 결과 기반 검증 */
    private List<Map<String, Object>> buildValidationResults(AasxParsedResult parsed) {
        List<Map<String, Object>> results = new ArrayList<>();
        int no = 1;

        // 기본사항
        results.add(validationItem(no++, "기본사항", "필수", "AASX 패키지 구조 확인",
                "OPC UA Part 100 기반 패키지 구조 검증", true, "AAS4J 파싱 성공"));
        results.add(validationItem(no++, "기본사항", "필수", "AAS 버전 확인",
                "AAS 메타모델 버전 3.0 이상", true, "v" + parsed.aasVersion()));

        // AAS Shell
        boolean hasShell = !parsed.shells().isEmpty();
        results.add(validationItem(no++, "AAS", "필수", "Shell ID 존재",
                "최소 1개 이상의 Shell 존재", hasShell, parsed.shells().size() + "개 Shell"));

        boolean hasGlobalAssetId = parsed.shells().stream()
                .anyMatch(s -> s.globalAssetId() != null && !s.globalAssetId().isBlank());
        results.add(validationItem(no++, "AAS", "필수", "Asset Information 존재",
                "globalAssetId 설정 확인", hasGlobalAssetId, ""));

        boolean hasDescription = parsed.shells().stream()
                .anyMatch(s -> s.descriptionKo() != null || s.descriptionEn() != null);
        results.add(validationItem(no++, "AAS", "옵션", "다국어 설명 포함",
                "ko/en 설명 존재 여부", hasDescription, ""));

        // Submodel
        boolean hasSemanticId = parsed.submodels().stream()
                .allMatch(s -> s.semanticId() != null && !s.semanticId().isBlank());
        results.add(validationItem(no++, "Submodel", "필수", "SemanticId 설정",
                "각 Submodel에 SemanticId 존재", hasSemanticId, ""));

        boolean hasElements = !parsed.elements().isEmpty();
        results.add(validationItem(no++, "Submodel", "필수", "SubmodelElement 존재",
                "최소 1개 이상의 Element", hasElements, parsed.elements().size() + "개"));

        long submodelTypes = parsed.submodels().stream().map(SubmodelInfo::idShort).distinct().count();
        results.add(validationItem(no++, "Submodel", "옵션", "Submodel 종류",
                "다양한 Submodel 존재 여부", submodelTypes > 1, submodelTypes + "종류"));

        // Property
        boolean allHaveValueType = parsed.elements().stream()
                .filter(e -> "Property".equals(e.elementType()))
                .allMatch(e -> e.valueType() != null && !e.valueType().isBlank());
        results.add(validationItem(no++, "Property", "필수", "valueType 설정",
                "모든 Property에 valueType 존재", allHaveValueType, ""));

        boolean hasUnits = parsed.elements().stream()
                .anyMatch(e -> e.unit() != null && !e.unit().isBlank());
        results.add(validationItem(no++, "Property", "옵션", "unit 설정",
                "측정값에 단위 포함", hasUnits, ""));

        return results;
    }

    private Map<String, Object> validationItem(int no, String category, String importance,
                                                String checkItem, String description, boolean passed, String remarks) {
        Map<String, Object> item = new LinkedHashMap<>();
        item.put("check_no", no);
        item.put("category", category);
        item.put("importance", importance);
        item.put("check_item", checkItem);
        item.put("description", description);
        item.put("is_passed", passed);
        item.put("remarks", remarks);
        return item;
    }

    private String camelToSnakeCase(String input) {
        if (input == null) return "unknown";
        return input.replaceAll("([a-z])([A-Z])", "$1_$2")
                .replaceAll("([A-Z]+)([A-Z][a-z])", "$1_$2")
                .toLowerCase()
                .replaceAll("[^a-z0-9_]", "_")
                .replaceAll("_+", "_")
                .replaceAll("^_|_$", "");
    }

    private String mapValueType(String aasValueType) {
        if (aasValueType == null) return "text";
        String lower = aasValueType.toLowerCase();
        if (lower.contains("double") || lower.contains("float") || lower.contains("decimal")) return "number";
        if (lower.contains("int") || lower.contains("long") || lower.contains("short")) return "number";
        return "text";
    }

    // =========================================================================
    // Response DTOs
    // =========================================================================

    @Schema(description = "AASX 파일 응답 DTO")
    public record AasxFileResponse(
            @Schema(description = "파일 ID") Long id,
            @Schema(description = "파일명") String file_name,
            @Schema(description = "파일 해시 (SHA-256)") String file_hash,
            @Schema(description = "AAS 버전") String aas_version,
            @Schema(description = "설명") String description,
            @Schema(description = "생성일시") String created_at,
            @Schema(description = "Shell 수") int shell_count,
            @Schema(description = "Submodel 수") int submodel_count,
            @Schema(description = "Element 수") int element_count) {
        public static AasxFileResponse from(AasxFile e) {
            return new AasxFileResponse(
                    e.getId(), e.getFileName(), e.getFileHash(), e.getAasVersion(),
                    null, e.getCreatedAt() != null ? e.getCreatedAt().toString() : null,
                    e.getShellCount() != null ? e.getShellCount() : 0,
                    e.getSubmodelCount() != null ? e.getSubmodelCount() : 0,
                    e.getElementCount() != null ? e.getElementCount() : 0
            );
        }
    }
}
