package com.peakmate.backend.domain.aas.dto;

import java.util.List;

public record CsvImportResult(
        int inserted,
        int updated,
        List<CsvErrorEntry> errors,
        List<String> unmatchedEquipNames
) {
    public record CsvErrorEntry(int row, String reason) {}
}
