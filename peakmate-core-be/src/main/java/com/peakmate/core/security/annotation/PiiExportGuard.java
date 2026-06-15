package com.peakmate.core.security.annotation;

import java.lang.annotation.ElementType;
import java.lang.annotation.Retention;
import java.lang.annotation.RetentionPolicy;
import java.lang.annotation.Target;

/**
 * 엑셀/CSV 내보내기 시 개인정보 보호를 강제하는 어노테이션.
 * 이 어노테이션이 붙은 컨트롤러 메서드는:
 * 1. PII 감사 로그가 자동 기록됩니다.
 * 2. export 권한이 있는 사용자만 호출 가능합니다.
 * 3. 응답 데이터에서 PII 필드가 자동 마스킹됩니다.
 */
@Target(ElementType.METHOD)
@Retention(RetentionPolicy.RUNTIME)
public @interface PiiExportGuard {
    String targetTable() default "";
    String description() default "개인정보 포함 데이터 내보내기";
}
