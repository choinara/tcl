import React from 'react';

/**
 * 값이 있으면 반환, 없으면 fallback(기본값 '-') 반환
 */
export const displayValue = (value: unknown, fallback: React.ReactNode = '-'): React.ReactNode =>
    value !== null && value !== undefined && value !== '' ? (value as React.ReactNode) : fallback;
