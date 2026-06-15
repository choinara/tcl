package com.peakmate.backend.domain.admin.entity;

import com.fasterxml.jackson.annotation.JsonCreator;
import com.fasterxml.jackson.annotation.JsonValue;
import lombok.Getter;

import java.util.Arrays;

@Getter
public enum BankCode {
    KDB("002", "산업은행"),
    IBK("003", "기업은행"),
    KB("004", "국민은행"),
    NH("011", "농협은행"),
    WOORI("020", "우리은행"),
    SC("023", "SC제일은행"),
    CITI("027", "한국씨티은행"),
    DAEGU("031", "대구은행"),
    BUSAN("032", "부산은행"),
    GWANGJU("034", "광주은행"),
    JEJU("035", "제주은행"),
    JEONBUK("037", "전북은행"),
    GYEONGNAM("039", "경남은행"),
    HANA("081", "하나은행"),
    SHINHAN("088", "신한은행"),
    KAKAO("090", "카카오뱅크"),
    K("089", "케이뱅크"),
    TOSS("092", "토스뱅크");

    @JsonValue
    private final String code; // DB 저장값 (예: "002")
    private final String name; // 표시명 (예: "산업은행")

    BankCode(String code, String name) {
        this.code = code;
        this.name = name;
    }

    @JsonCreator
    public static BankCode from(String value) {
        return Arrays.stream(values())
                .filter(b -> b.code.equals(value) || b.name().equalsIgnoreCase(value))
                .findFirst()
                .orElse(null);
    }

    public static BankCode fromCode(String code) {
        return Arrays.stream(values())
                .filter(b -> b.code.equals(code))
                .findFirst()
                .orElseThrow(() -> new IllegalArgumentException("Unknown BankCode: " + code));
    }
}
