package com.peakmate.backend.domain.aas.service;

import com.peakmate.backend.domain.aas.dto.AasxParsedResult;
import com.peakmate.backend.domain.aas.dto.AasxParsedResult.ElementInfo;
import com.peakmate.backend.domain.aas.dto.AasxParsedResult.ShellInfo;
import com.peakmate.backend.domain.aas.dto.AasxParsedResult.SubmodelInfo;
import lombok.extern.slf4j.Slf4j;
import org.eclipse.digitaltwin.aas4j.v3.dataformat.aasx.AASXDeserializer;
import org.eclipse.digitaltwin.aas4j.v3.dataformat.xml.XmlDeserializer;
import org.eclipse.digitaltwin.aas4j.v3.model.*;
import org.springframework.stereotype.Service;

import java.io.ByteArrayInputStream;
import java.io.InputStream;
import java.nio.charset.StandardCharsets;
import java.util.*;
import java.util.zip.ZipEntry;
import java.util.zip.ZipInputStream;

@Slf4j
@Service
public class AasxParsingService {

    public AasxParsedResult parse(byte[] aasxBytes) {
        // 1차 시도: AASXDeserializer 기본 경로 (JSON 또는 올바른 content-type의 XML)
        try (InputStream is = new ByteArrayInputStream(aasxBytes)) {
            AASXDeserializer deserializer = new AASXDeserializer(is);
            Environment env = deserializer.read();
            return buildResult(env);
        } catch (Exception primary) {
            log.debug("AASXDeserializer 기본 파싱 실패, XML fallback 시도: {}", primary.getMessage());
        }

        // 2차 시도: XML fallback (content-type이 text/xml 등 비표준인 AAS V3 XML AASX)
        try {
            Environment env = parseXmlFromAasx(aasxBytes);
            return buildResult(env);
        } catch (IllegalArgumentException iae) {
            log.warn("AASX 파싱 거부: {}", iae.getMessage());
            throw iae;
        } catch (Exception e) {
            log.error("AASX XML fallback 파싱 실패", e);
            throw new IllegalArgumentException("AASX 파일 파싱에 실패했습니다: " + e.getMessage(), e);
        }
    }

    /**
     * AASX ZIP에서 AAS 콘텐츠 XML을 직접 추출하여 XmlDeserializer로 파싱한다.
     * AAS V2/V1 파일은 지원하지 않으므로 감지 시 명확한 예외를 던진다.
     */
    private Environment parseXmlFromAasx(byte[] aasxBytes) throws Exception {
        String aasContentPath = findAasContentPath(aasxBytes);
        if (aasContentPath == null) {
            throw new IllegalArgumentException("AASX 파일에서 AAS 콘텐츠 경로를 찾을 수 없습니다.");
        }
        String normalizedPath = aasContentPath.startsWith("/") ? aasContentPath.substring(1) : aasContentPath;

        try (ZipInputStream zis = new ZipInputStream(new ByteArrayInputStream(aasxBytes))) {
            ZipEntry entry;
            while ((entry = zis.getNextEntry()) != null) {
                if (!normalizedPath.equals(entry.getName())) continue;

                byte[] rawBytes = zis.readAllBytes();

                // UTF-8 BOM (0xEF 0xBB 0xBF) 제거 — BOM + XML 선언 없는 파일은 파서가 실패함
                byte[] xmlBytes = (rawBytes.length >= 3
                        && (rawBytes[0] & 0xFF) == 0xEF
                        && (rawBytes[1] & 0xFF) == 0xBB
                        && (rawBytes[2] & 0xFF) == 0xBF)
                        ? Arrays.copyOfRange(rawBytes, 3, rawBytes.length) : rawBytes;

                String xmlHeader = new String(xmlBytes, 0, Math.min(1000, xmlBytes.length), StandardCharsets.UTF_8);

                // AAS V2/V1 감지 — 지원하지 않으므로 명확한 메시지 반환
                if (xmlHeader.contains("admin-shell.io/aas/2/") || xmlHeader.contains("admin-shell.io/aas/1/")) {
                    throw new IllegalArgumentException(
                            "AAS V2/V1 파일은 지원하지 않습니다. AAS V3 파일만 업로드할 수 있습니다.");
                }

                // AAS4J 1.0.x Jackson 버그: <supplementalSemanticIds /> 빈 태그 → TreeNode.isArray() NPE
                // 해당 필드는 보조 시맨틱 ID 목록으로 비어 있을 때 생략해도 무방
                String xmlString = new String(xmlBytes, StandardCharsets.UTF_8);
                xmlString = xmlString
                        .replaceAll("<supplementalSemanticIds\\s*/>", "")
                        .replaceAll("(?s)<supplementalSemanticIds>\\s*</supplementalSemanticIds>", "");
                xmlBytes = xmlString.getBytes(StandardCharsets.UTF_8);

                XmlDeserializer xmlDeserializer = new XmlDeserializer();
                Environment env = xmlDeserializer.read(new ByteArrayInputStream(xmlBytes));
                log.info("[AASX XML fallback 파싱 완료] path={}", normalizedPath);
                return env;
            }
        }
        throw new IllegalArgumentException("AASX 파일에서 AAS XML 콘텐츠를 찾을 수 없습니다: " + aasContentPath);
    }

    /**
     * aasx/_rels/aasx-origin.rels 에서 aas-spec 관계의 Target 경로를 읽는다.
     */
    private String findAasContentPath(byte[] aasxBytes) throws Exception {
        try (ZipInputStream zis = new ZipInputStream(new ByteArrayInputStream(aasxBytes))) {
            ZipEntry entry;
            while ((entry = zis.getNextEntry()) != null) {
                if (!"aasx/_rels/aasx-origin.rels".equals(entry.getName())) continue;

                String relsContent = new String(zis.readAllBytes(), StandardCharsets.UTF_8);
                int typeIdx = relsContent.indexOf("aas-spec");
                if (typeIdx < 0) continue;

                int targetIdx = relsContent.indexOf("Target=\"", typeIdx);
                if (targetIdx < 0) continue;

                int start = targetIdx + 8;
                int end = relsContent.indexOf("\"", start);
                if (end >= 0) return relsContent.substring(start, end);
            }
        }
        return null;
    }

    /**
     * AAS4J Environment 객체를 AasxParsedResult DTO로 변환한다.
     */
    private AasxParsedResult buildResult(Environment env) {
        List<ShellInfo> shells = new ArrayList<>();
        List<SubmodelInfo> submodelInfos = new ArrayList<>();
        List<ElementInfo> elementInfos = new ArrayList<>();
        Map<String, List<String>> shellSubmodelRefs = new HashMap<>();

        // Shell 추출
        for (AssetAdministrationShell aas : safe(env.getAssetAdministrationShells())) {
            AssetInformation assetInfo = aas.getAssetInformation();
            String assetKind = assetInfo != null && assetInfo.getAssetKind() != null
                    ? assetInfo.getAssetKind().name() : "Instance";
            String globalAssetId = assetInfo != null ? assetInfo.getGlobalAssetId() : null;

            shells.add(new ShellInfo(
                    aas.getIdShort(), globalAssetId, assetKind,
                    extractDescription(aas.getDescription(), "ko"),
                    extractDescription(aas.getDescription(), "en")
            ));

            List<String> refs = new ArrayList<>();
            for (Reference ref : safe(aas.getSubmodels())) {
                for (Key key : safe(ref.getKeys())) refs.add(key.getValue());
            }
            shellSubmodelRefs.put(aas.getIdShort(), refs);
        }

        Map<String, String> submodelIdToIdShort = new HashMap<>();
        for (Submodel sm : safe(env.getSubmodels())) {
            submodelIdToIdShort.put(sm.getId(), sm.getIdShort());
        }

        // Submodel + Element 추출
        for (Submodel sm : safe(env.getSubmodels())) {
            String semanticId = extractSemanticId(sm.getSemanticId());
            String parentShell = findParentShell(shellSubmodelRefs, submodelIdToIdShort, sm.getId());

            List<ElementInfo> smElements = new ArrayList<>();
            flattenElements(safe(sm.getSubmodelElements()), sm.getIdShort(), "", smElements);

            submodelInfos.add(new SubmodelInfo(sm.getIdShort(), semanticId, parentShell, smElements.size()));
            elementInfos.addAll(smElements);
        }

        log.info("[AASX 파싱 완료] shells={}, submodels={}, elements={}",
                shells.size(), submodelInfos.size(), elementInfos.size());

        return new AasxParsedResult("3.0", shells, submodelInfos, elementInfos);
    }

    /**
     * SubmodelElement를 재귀적으로 평탄화한다.
     */
    private void flattenElements(Collection<SubmodelElement> elements, String submodelIdShort,
                                  String parentPath, List<ElementInfo> result) {
        for (SubmodelElement elem : elements) {
            String path = parentPath.isEmpty()
                    ? "/" + elem.getIdShort()
                    : parentPath + "/" + elem.getIdShort();

            if (elem instanceof SubmodelElementCollection smc) {
                result.add(toElementInfo(submodelIdShort, elem, "SubmodelElementCollection", path));
                flattenElements(safe(smc.getValue()), submodelIdShort, path, result);

            } else if (elem instanceof SubmodelElementList sml) {
                result.add(toElementInfo(submodelIdShort, elem, "SubmodelElementList", path));
                flattenElements(safe(sml.getValue()), submodelIdShort, path, result);

            } else if (elem instanceof Property prop) {
                result.add(new ElementInfo(
                        submodelIdShort,
                        prop.getIdShort(),
                        "Property",
                        path,
                        prop.getValueType() != null ? prop.getValueType().name() : null,
                        prop.getValue(),
                        extractUnit(prop),
                        extractSemanticId(prop.getSemanticId()),
                        extractDescription(prop.getDescription(), "ko"),
                        extractDescription(prop.getDescription(), "en")
                ));

            } else if (elem instanceof Range range) {
                result.add(new ElementInfo(
                        submodelIdShort,
                        range.getIdShort(),
                        "Range",
                        path,
                        range.getValueType() != null ? range.getValueType().name() : null,
                        null, null,
                        extractSemanticId(range.getSemanticId()),
                        extractDescription(range.getDescription(), "ko"),
                        extractDescription(range.getDescription(), "en")
                ));

            } else if (elem instanceof Blob) {
                result.add(toElementInfo(submodelIdShort, elem, "Blob", path));

            } else if (elem instanceof File) {
                result.add(toElementInfo(submodelIdShort, elem, "File", path));

            } else if (elem instanceof ReferenceElement) {
                result.add(toElementInfo(submodelIdShort, elem, "ReferenceElement", path));

            } else if (elem instanceof MultiLanguageProperty mlp) {
                String value = extractDescription(mlp.getValue(), "ko");
                if (value == null) value = extractDescription(mlp.getValue(), "en");
                result.add(new ElementInfo(
                        submodelIdShort, mlp.getIdShort(), "MultiLanguageProperty", path,
                        "langStringSet", value, null,
                        extractSemanticId(mlp.getSemanticId()),
                        extractDescription(mlp.getDescription(), "ko"),
                        extractDescription(mlp.getDescription(), "en")
                ));

            } else {
                result.add(toElementInfo(submodelIdShort, elem, elem.getClass().getSimpleName(), path));
            }
        }
    }

    private ElementInfo toElementInfo(String submodelIdShort, SubmodelElement elem, String type, String path) {
        return new ElementInfo(
                submodelIdShort, elem.getIdShort(), type, path,
                null, null, null,
                extractSemanticId(elem.getSemanticId()),
                extractDescription(elem.getDescription(), "ko"),
                extractDescription(elem.getDescription(), "en")
        );
    }

    // =========================================================================
    // Helper methods
    // =========================================================================

    private String findParentShell(Map<String, List<String>> shellSubmodelRefs,
                                    Map<String, String> submodelIdToIdShort, String submodelId) {
        for (Map.Entry<String, List<String>> entry : shellSubmodelRefs.entrySet()) {
            if (entry.getValue().contains(submodelId)) return entry.getKey();
        }
        return shellSubmodelRefs.keySet().stream().findFirst().orElse(null);
    }

    private String extractSemanticId(Reference ref) {
        if (ref == null || ref.getKeys() == null || ref.getKeys().isEmpty()) return null;
        return ref.getKeys().get(0).getValue();
    }

    private String extractDescription(List<LangStringTextType> descriptions, String lang) {
        if (descriptions == null) return null;
        return descriptions.stream()
                .filter(d -> lang.equalsIgnoreCase(d.getLanguage()))
                .map(LangStringTextType::getText)
                .findFirst()
                .orElse(null);
    }

    private String extractUnit(Property prop) {
        if (prop.getQualifiers() != null) {
            return prop.getQualifiers().stream()
                    .filter(q -> "unit".equalsIgnoreCase(q.getType()) || "Unit".equalsIgnoreCase(q.getType()))
                    .map(Qualifier::getValue)
                    .findFirst()
                    .orElse(null);
        }
        return null;
    }

    @SuppressWarnings("unchecked")
    private <T> Collection<T> safe(Collection<T> collection) {
        return collection != null ? collection : Collections.emptyList();
    }

    private <T> List<T> safe(List<T> list) {
        return list != null ? list : Collections.emptyList();
    }
}
