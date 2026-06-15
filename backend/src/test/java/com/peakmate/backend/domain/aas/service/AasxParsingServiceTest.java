package com.peakmate.backend.domain.aas.service;

import com.peakmate.backend.domain.aas.dto.AasxParsedResult;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;

import static org.assertj.core.api.Assertions.assertThat;
import static org.junit.jupiter.api.Assertions.assertDoesNotThrow;

/**
 * AasxParsingService 단위 테스트 — 실제 AASX 파일로 파싱 동작 검증.
 * HopperDryer.aasx: UTF-8 BOM + supplementalSemanticIds 필드 포함 (AAS4J 1.0.2 NPE 재현 파일)
 */
class AasxParsingServiceTest {

    private static final String HOPPER_DRYER_PATH =
        System.getProperty("user.home") +
        "/Dropbox/100_HangSeo/01_HJPJT/100_PJT_ING/120_솔브레인/2025_자율형공장 지원사업" +
        "/300_자율형공장 진행/301_AAS/3011_KOSMO표준가이드/kosmo-AAS_Pubilc-main" +
        "/ABH_MICUBE_IMPIX-main/ABH_V2/1. HopperDryer(호퍼기)/HopperDryer.aasx";

    private final AasxParsingService parsingService = new AasxParsingService();

    @Test
    @DisplayName("HopperDryer.aasx 파싱 — supplementalSemanticIds NPE 재현 파일 (AAS4J 1.0.4)")
    void parse_hopperDryerAasx_success() throws IOException {
        Path aasxPath = Path.of(HOPPER_DRYER_PATH);
        org.junit.jupiter.api.Assumptions.assumeTrue(Files.exists(aasxPath),
            "HopperDryer.aasx 파일이 없어 테스트 건너뜀: " + aasxPath);

        byte[] bytes = Files.readAllBytes(aasxPath);

        AasxParsedResult result = assertDoesNotThrow(() -> parsingService.parse(bytes),
            "AASX 파싱 중 예외 발생 — supplementalSemanticIds NPE 미수정 가능성");

        assertThat(result).isNotNull();
        assertThat(result.aasVersion()).isEqualTo("3.0");
        assertThat(result.shells()).isNotEmpty();
        assertThat(result.submodels()).isNotEmpty();
        assertThat(result.elements()).isNotEmpty();
    }
}
