/**
 * 기본 배지 스타일 설정
 * 모든 페이지에서 사용할 수 있는 기본 스타일
 */

export interface BadgeStyleConfig {
    [key: string]: {
        bgColor: string;
        textColor: string;
        borderColor: string;
    };
}

export const defaultBadgeStyles: BadgeStyleConfig = {
    default: {
        bgColor: '#F5F5F5',
        textColor: '#222222',
        borderColor: '#E0E0E0',
    },
    success: {
        bgColor: '#E8F5E9',
        textColor: '#2E7D32',
        borderColor: '#4caf50',
    },
    warning: {
        bgColor: '#FFF3E0',
        textColor: '#E65100',
        borderColor: '#ff9800',
    },
    error: {
        bgColor: '#FFEBEE',
        textColor: '#C62828',
        borderColor: '#f44336',
    },
    info: {
        bgColor: '#E3F2FD',
        textColor: '#1565C0',
        borderColor: '#2196f3',
    },
};

export const productionStatusStyles: BadgeStyleConfig = {
    "판매중":   { bgColor: "#E8EEFF", textColor: "#3B5CCC", borderColor: "#3B5CCC" },
    "제작중":   { bgColor: "#CFE7F9", textColor: "#0C4A6E", borderColor: "#0C4A6E" },
    "제작대기": { bgColor: "#F1F5F9", textColor: "#475569", borderColor: "#475569"},
    "제작완료": { bgColor: "#D1F7E0", textColor: "#166534", borderColor: "#166534" },
    "Disable":  { bgColor: "#E5E7EB", textColor: "#475569", borderColor: "#475569" },
};

export const productionPriorityStyles: BadgeStyleConfig = {
    "낮음": { bgColor: "#F1F5F9", textColor: "#475569", borderColor: "#475569" },
    "보통": { bgColor: "#E8EEFF", textColor: "#3B5CCC", borderColor: "#3B5CCC" },
    "높음": { bgColor: "#FEF3C7", textColor: "#B45309", borderColor: "#B45309" },
    "긴급": { bgColor: "#FEE2E2", textColor: "#B91C1C", borderColor: "#B91C1C" },
    "주문제작": { bgColor: "#F3E8FF", textColor: "#6D28D9", borderColor: "#6D28D9" },
};

export const productionPartBageColors: BadgeStyleConfig = {
    B:  { bgColor: "#E8EEFF", textColor: "#3B5CCC", borderColor: "#3B5CCC" },
    P:  { bgColor: "#E8EEFF", textColor: "#3B5CCC", borderColor: "#3B5CCC" },
    M:  { bgColor: "#E8EEFF", textColor: "#3B5CCC", borderColor: "#3B5CCC" },
    S:  { bgColor: "#E8EEFF", textColor: "#3B5CCC", borderColor: "#3B5CCC" },
    O:  { bgColor: "#E8EEFF", textColor: "#3B5CCC", borderColor: "#3B5CCC" },
    C:  { bgColor: "#E8EEFF", textColor: "#3B5CCC", borderColor: "#3B5CCC" },
    MR: { bgColor: "#E8EEFF", textColor: "#3B5CCC", borderColor: "#3B5CCC" },
};

export const productionDifficultyStyles : BadgeStyleConfig = {
    "하": { bgColor: "#D1F7E0", textColor: "#166534", borderColor: "#166534" },
    "중": { bgColor: "#FFF3E0", textColor: "#E65100", borderColor: "#E65100" },
    "상": { bgColor: "#FFEBEE", textColor: "#C62828", borderColor: "#C62828" },
};

/**
 * 선곡 상태 배지 스타일
 */
export const songSelectionStatusStyles: BadgeStyleConfig = {
    "선곡대기": { bgColor: "#F1F5F9", textColor: "#475569", borderColor: "#475569" },
    "선곡확정": { bgColor: "#E8EEFF", textColor: "#3B5CCC", borderColor: "#3B5CCC" },
    "선곡완료": { bgColor: "#D1F7E0", textColor: "#166534", borderColor: "#166534" },
};
