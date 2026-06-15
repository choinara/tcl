/**
 * Badge 스타일 설정 인터페이스
 * 각 도메인에서 구현해야 할 Badge 스타일의 타입 정의
 */

export interface BadgeStyleValue {
    bgColor: string;
    textColor: string;
    borderColor?: string;  // 선택사항: 보더가 없으면 생략 가능
}

export interface BadgeStyleConfig {
    [variantName: string]: BadgeStyleValue;
}

/**
 * Badge 스타일 설정 가이드
 *
 * 예시:
 * ```
 * export const ordersBadgeStyles: BadgeStyleConfig = {
 *     pending: {
 *         bgColor: '#FFF3E0',
 *         textColor: '#E65100',
 *         borderColor: '#FFB74D',
 *     },
 *     shipped: {
 *         bgColor: '#E8F5E9',
 *         textColor: '#1B5E20',
 *         borderColor: '#81C784',
 *     },
 * };
 * ```
 */
