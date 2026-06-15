package com.peakmate.core.log;

import java.lang.annotation.ElementType;
import java.lang.annotation.Retention;
import java.lang.annotation.RetentionPolicy;
import java.lang.annotation.Target;

/**
 * 컨트롤러 메서드 실행 성공 시 시스템 로그를 자동 기록하는 어노테이션.
 * AOP Aspect(SystemLogAspect)가 메서드 성공 후 로그를 기록한다.
 * 메서드 실행 중 예외 발생 시 로그를 남기지 않는다.
 *
 * detail 속성에 SpEL 표현식을 사용하여 메서드 파라미터를 참조할 수 있다:
 * <pre>
 * {@code @SystemLog(type = "MENU_CHANGE", action = "메뉴 생성", detail = "'메뉴 생성: ' + #request.menuCode()")}
 * </pre>
 */
@Target(ElementType.METHOD)
@Retention(RetentionPolicy.RUNTIME)
public @interface SystemLog {
    /** 로그 유형 (예: "MENU_CHANGE", "USER_CREATE") */
    String type();

    /** 한글 액션명 (예: "메뉴 생성", "사용자 수정") */
    String action();

    /** 상세 설명 — SpEL 지원 (예: "'메뉴 생성: ' + #request.menuCode()"). 빈 문자열이면 action과 동일 */
    String detail() default "";
}
