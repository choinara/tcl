/**
 * 상태별 Chip 스타일 정의
 */

export const STATUS_STYLES: Record<string, { bg: string; color: string }> = {
  // 판매 상태
  '판매중': { bg: '#E8EEFF', color: '#3B5CCC' },
  'Disable': { bg: '#E5E7EB', color: '#475569' },

  // 제작 상태
  '제작대기': { bg: '#F1F5F9', color: '#475569' },
  '제작완료': { bg: '#EAFAF1', color: '#1E8449' },
  '제작중': { bg: '#EBF5FB', color: '#2874A6' },
};

export const getStatusStyle = (status: string) => {
  return STATUS_STYLES[status] ?? { bg: '#F2F3F4', color: '#717D7E' };
};
