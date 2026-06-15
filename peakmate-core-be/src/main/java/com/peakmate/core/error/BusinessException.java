package com.peakmate.core.error;

import lombok.Getter;

@Getter
public class BusinessException extends RuntimeException {

    private final ErrorCodeProvider errorCode;

    public BusinessException(String message, ErrorCodeProvider errorCode) {
        super(message);
        this.errorCode = errorCode;
    }

    public BusinessException(ErrorCodeProvider errorCode) {
        super(errorCode.getMessage());
        this.errorCode = errorCode;
    }
}
