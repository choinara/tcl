package com.peakmate.core.security.annotation;

import java.lang.annotation.ElementType;
import java.lang.annotation.Retention;
import java.lang.annotation.RetentionPolicy;
import java.lang.annotation.Target;

@Target(ElementType.METHOD)
@Retention(RetentionPolicy.RUNTIME)
public @interface RequirePermission {
    String menu() default "";
    String action();
    // 복수 메뉴 허용 (OR 조건). 기존 menu() 사용 코드와 하위 호환
    String[] menus() default {};
}
