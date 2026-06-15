package com.peakmate.core.error;

/**
 * 에러 코드 제공자 인터페이스.
 * 공통 에러 코드(CommonErrorCode)와 프로젝트 전용 에러 코드가 이 인터페이스를 구현한다.
 */
public interface ErrorCodeProvider {
    int getStatus();
    String getCode();
    String getMessage();
}
