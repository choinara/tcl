package com.peakmate.backend.domain.aas.dto;

import java.util.List;

/**
 * AASX 파싱 결과 DTO.
 * AAS4J 라이브러리로 파싱한 결과를 내부 도메인 형식으로 변환한 구조체.
 */
public record AasxParsedResult(
        String aasVersion,
        List<ShellInfo> shells,
        List<SubmodelInfo> submodels,
        List<ElementInfo> elements
) {

    public record ShellInfo(
            String idShort,
            String globalAssetId,
            String assetKind,
            String descriptionKo,
            String descriptionEn
    ) {}

    public record SubmodelInfo(
            String idShort,
            String semanticId,
            String parentShellIdShort,
            int elementCount
    ) {}

    public record ElementInfo(
            String submodelIdShort,
            String idShort,
            String elementType,
            String elementPath,
            String valueType,
            String value,
            String unit,
            String semanticId,
            String descriptionKo,
            String descriptionEn
    ) {}
}
