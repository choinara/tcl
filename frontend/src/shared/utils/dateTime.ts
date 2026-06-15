/**
 * 날짜/시간 유틸리티 함수
 */

/**
 * 현재 시간을 "yyyy.MM.dd HH:mm:ss" 형식으로 반환
 * @example
 * formatDateTimeNow() // "2026.02.27 15:30:45"
 */
export const formatDateTimeNow = (): string => {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const day = String(now.getDate()).padStart(2, '0');
    const hours = String(now.getHours()).padStart(2, '0');
    const minutes = String(now.getMinutes()).padStart(2, '0');
    const seconds = String(now.getSeconds()).padStart(2, '0');
    return `${year}.${month}.${day} ${hours}:${minutes}:${seconds}`;
};

/**
 * 특정 Date 객체를 "yyyy.MM.dd HH:mm:ss" 형식으로 반환
 * @param date - 변환할 Date 객체
 * @example
 * formatDateTime(new Date('2026-02-27')) // "2026.02.27 00:00:00"
 */
export const formatDateTime = (date: Date): string => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const hours = String(date.getHours()).padStart(2, '0');
    const minutes = String(date.getMinutes()).padStart(2, '0');
    const seconds = String(date.getSeconds()).padStart(2, '0');
    return `${year}.${month}.${day} ${hours}:${minutes}:${seconds}`;
};
