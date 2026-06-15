package com.peakmate.backend.domain.admin.entity;

import lombok.Getter;

import java.util.Arrays;

@Getter
public enum TeamCode {

    // ROOT
    DEV("DEV", "개발팀"),
    CONTENT("CONTENT", "컨텐츠팀"),
    MGMT("MGMT", "경영지원팀"),

    // CONTENT children (예시)
    BAND1("BAND1", "밴드1팀"),
    BAND2("BAND2", "밴드2팀"),
    PIANO1("PIANO1", "피아노1팀"),
    PIANO2("PIANO2", "피아노2팀");

    private final String code;   // DB 저장값
    private final String name;   // 표시명

    TeamCode(String code, String name) {
        this.code = code;
        this.name = name;
    }

    public static TeamCode fromCode(String code) {
        return Arrays.stream(values())
                .filter(t -> t.code.equals(code))
                .findFirst()
                .orElseThrow(() -> new IllegalArgumentException("Unknown TeamCode: " + code));
    }
}
