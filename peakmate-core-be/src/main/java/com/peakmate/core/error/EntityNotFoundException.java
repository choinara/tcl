package com.peakmate.core.error;

public class EntityNotFoundException extends BusinessException {

    public EntityNotFoundException(String message) {
        super(message, CommonErrorCode.ENTITY_NOT_FOUND);
    }

    public EntityNotFoundException(ErrorCodeProvider errorCode) {
        super(errorCode);
    }
}
