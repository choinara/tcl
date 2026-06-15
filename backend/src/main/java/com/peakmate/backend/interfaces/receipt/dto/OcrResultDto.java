package com.peakmate.backend.interfaces.receipt.dto;

import com.fasterxml.jackson.annotation.JsonProperty;
import lombok.*;

import java.util.List;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class OcrResultDto {

    private SupplierInfo supplier;

    @JsonProperty("transaction_date")
    private String transactionDate;

    @JsonProperty("document_code")
    private String documentCode;

    @JsonProperty("receiver_name")
    private String receiverName;

    @JsonProperty("receiver_contact")
    private String receiverContact;

    private List<LineItemDto> items;

    private SummaryDto summary;

    @JsonProperty("handwritten_notes")
    private String handwrittenNotes;

    private ValidationDto validation;

    @Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
    public static class SupplierInfo {
        private String name;
        @JsonProperty("business_number")
        private String businessNumber;
        private String representative;
        private String phone;
        private String fax;
        private String address;
    }

    @Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
    public static class LineItemDto {
        private Integer seq;
        @JsonProperty("part_number")
        private String partNumber;
        @JsonProperty("part_name")
        private String partName;
        private String model;
        private int quantity;
        @JsonProperty("unit_price")
        private long unitPrice;
        private long amount;
        private String remarks;
    }

    @Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
    public static class SummaryDto {
        @JsonProperty("supply_amount")
        private Long supplyAmount;
        private Long vat;
        private long total;
        @JsonProperty("outstanding_balance")
        private Long outstandingBalance;
    }

    @Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
    public static class ValidationDto {
        @JsonProperty("is_valid")
        private boolean isValid;
        private List<String> errors;
        private List<String> warnings;
    }
}
