package com.peakmate.backend.domain.aas.service;

import com.peakmate.backend.domain.aas.dto.AasxParsedResult;
import com.peakmate.backend.domain.aas.dto.AasxParsedResult.ElementInfo;
import com.peakmate.backend.domain.aas.dto.AasxParsedResult.ShellInfo;
import com.peakmate.backend.domain.aas.dto.AasxParsedResult.SubmodelInfo;
import com.peakmate.backend.domain.aas.entity.*;
import com.peakmate.backend.infra.repository.aas.*;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.*;

/**
 * AAS 모델 도메인 서비스
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class AasModelDomainService {

    private final AasxFileJpaRepository aasxFileJpaRepository;
    private final AasShellJpaRepository aasShellJpaRepository;
    private final AasSubmodelJpaRepository aasSubmodelJpaRepository;
    private final AasElementJpaRepository aasElementJpaRepository;
    private final AssetTypeJpaRepository assetTypeJpaRepository;

    /**
     * AASX 파일 목록 조회
     */
    @Transactional(readOnly = true)
    public List<AasxFile> getAasxFiles() {
        log.debug("[AASX 파일 목록 조회]");
        return aasxFileJpaRepository.findByUseYnOrderByCreatedAtDesc("Y");
    }

    /**
     * AASX 파일 저장 + Shell/Submodel/Element cascade 저장
     */
    @Transactional
    public AasxFile saveAasxWithParsedData(AasxFile aasxFile, List<AasShell> shells,
                                            List<AasSubmodel> submodels, List<AasElement> elements) {
        log.debug("[AASX 저장] fileName={}", aasxFile.getFileName());
        AasxFile saved = aasxFileJpaRepository.save(aasxFile);

        for (AasShell shell : shells) {
            aasShellJpaRepository.save(shell);
        }
        for (AasSubmodel submodel : submodels) {
            aasSubmodelJpaRepository.save(submodel);
        }
        for (AasElement element : elements) {
            aasElementJpaRepository.save(element);
        }

        return saved;
    }

    /**
     * 파싱 데이터 조회 (Shell → Submodel → Element 계층)
     */
    @Transactional(readOnly = true)
    public List<AasShell> getShellsByFileId(Long fileId) {
        return aasShellJpaRepository.findByAasxFileId(fileId);
    }

    @Transactional(readOnly = true)
    public List<AasSubmodel> getSubmodelsByShellId(Long shellId) {
        return aasSubmodelJpaRepository.findByShellId(shellId);
    }

    @Transactional(readOnly = true)
    public List<AasElement> getElementsBySubmodelId(Long submodelId) {
        return aasElementJpaRepository.findBySubmodelId(submodelId);
    }

    /**
     * 파싱 결과를 DB에 저장합니다 (AasxFile + Shell + Submodel + Element).
     */
    @Transactional
    public AasxFile saveFromParsedResult(String fileName, String fileHash, Long fileSize,
                                          AasxParsedResult parsed) {
        log.info("[AASX 저장] fileName={}, shells={}, submodels={}, elements={}",
                fileName, parsed.shells().size(), parsed.submodels().size(), parsed.elements().size());

        // 1. AasxFile 저장
        AasxFile aasxFile = AasxFile.create(fileName, fileHash, null, fileSize,
                parsed.aasVersion(), parsed.shells().size(), parsed.submodels().size(), parsed.elements().size());
        AasxFile savedFile = aasxFileJpaRepository.save(aasxFile);

        // 2. Shell 저장
        Map<String, Long> shellIdShortToId = new HashMap<>();
        for (ShellInfo si : parsed.shells()) {
            String desc = si.descriptionKo() != null ? si.descriptionKo() : si.descriptionEn();
            AasShell shell = AasShell.create(savedFile.getId(), si.idShort(), si.globalAssetId(), si.assetKind(), desc);
            AasShell savedShell = aasShellJpaRepository.save(shell);
            shellIdShortToId.put(si.idShort(), savedShell.getId());
        }

        // 3. Submodel 저장
        Map<String, Long> submodelIdShortToId = new HashMap<>();
        for (SubmodelInfo smi : parsed.submodels()) {
            Long shellId = shellIdShortToId.getOrDefault(smi.parentShellIdShort(),
                    shellIdShortToId.values().stream().findFirst().orElse(null));
            if (shellId == null) continue;

            AasSubmodel submodel = AasSubmodel.create(shellId, smi.idShort(), smi.semanticId(), smi.elementCount());
            AasSubmodel savedSm = aasSubmodelJpaRepository.save(submodel);
            submodelIdShortToId.put(smi.idShort(), savedSm.getId());
        }

        // 4. Element 저장
        for (ElementInfo ei : parsed.elements()) {
            Long submodelId = submodelIdShortToId.get(ei.submodelIdShort());
            if (submodelId == null) continue;

            AasElement element = AasElement.create(submodelId, ei.elementType(), ei.elementPath(),
                    ei.idShort(), ei.valueType(), ei.value(), ei.unit(),
                    ei.descriptionKo(), ei.descriptionEn(), ei.semanticId());
            aasElementJpaRepository.save(element);
        }

        return savedFile;
    }

    /**
     * 파싱 결과에서 Asset Type을 동적 생성합니다.
     * Shell의 idShort를 type_code로, Submodel의 Property Element를 field_schema로 매핑합니다.
     *
     * @return 생성/업데이트된 Asset Type 정보 (type_code, action)
     */
    @Transactional
    public Map<String, String> createAssetTypeFromParsed(AasxParsedResult parsed, String fileName) {
        if (parsed.shells().isEmpty()) {
            return Map.of("type_code", "", "action", "skipped");
        }

        ShellInfo shell = parsed.shells().get(0);
        String typeCode = camelToSnakeCase(shell.idShort());
        String typeName = shell.descriptionKo() != null ? shell.descriptionKo() : shell.idShort();
        String description = "AASX 자동 생성: " + fileName;

        // Element → field_schema 변환 (Property 타입만)
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

        // 중복 체크
        Optional<AssetType> existing = assetTypeJpaRepository.findByTypeCode(typeCode);
        if (existing.isPresent()) {
            AssetType at = existing.get();
            at.update(typeName, shell.globalAssetId(), description, fieldSchema);
            assetTypeJpaRepository.save(at);
            log.info("[Asset Type 업데이트] typeCode={}", typeCode);
            return Map.of("type_code", typeCode, "action", "updated");
        }

        AssetType newType = AssetType.create(typeCode, typeName, shell.globalAssetId(), description, fieldSchema);
        assetTypeJpaRepository.save(newType);
        log.info("[Asset Type 생성] typeCode={}, fields={}", typeCode, fieldSchema.size());
        return Map.of("type_code", typeCode, "action", "created");
    }

    /**
     * AASX 파일 단건 조회
     */
    @Transactional(readOnly = true)
    public Optional<AasxFile> findById(Long id) {
        return aasxFileJpaRepository.findById(id);
    }

    /**
     * AASX 파일 삭제 (cascade: Shell → Submodel → Element 모두 삭제)
     */
    @Transactional
    public void deleteAasxFile(Long fileId) {
        log.debug("[AASX 삭제] fileId={}", fileId);
        aasxFileJpaRepository.deleteById(fileId);
    }

    // =========================================================================
    // Private helpers
    // =========================================================================

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
        if (lower.contains("bool")) return "text";
        if (lower.contains("date") || lower.contains("time")) return "text";
        return "text";
    }
}
