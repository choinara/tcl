export const DAY_NAMES = ['일', '월', '화', '수', '목', '금', '토'] as const;

export type DayName = (typeof DAY_NAMES)[number];

export interface PeriodMonthView {
  key: string;
  year: number;
  month: number;
  label: string;
  shortLabel: string;
}

export function getDaysInMonth(year: number, month: number): number {
  return new Date(year, month, 0).getDate();
}

export function getDayOfWeek(year: number, month: number, day: number): number {
  return new Date(year, month - 1, day).getDay();
}

export function isWeekend(dayIndex: number): boolean {
  return dayIndex === 0 || dayIndex === 6;
}

export function getPeriodMonthViews(year: number, month: number, period: string): PeriodMonthView[] {
  const count = Math.max(1, parseInt(period, 10) || 1);
  return Array.from({ length: count }, (_, index) => {
    const date = new Date(year, month - 1 + index, 1);
    const viewYear = date.getFullYear();
    const viewMonth = date.getMonth() + 1;
    const paddedMonth = String(viewMonth).padStart(2, '0');
    return {
      key: `${viewYear}-${paddedMonth}`,
      year: viewYear,
      month: viewMonth,
      label: `${viewYear}년 ${viewMonth}월`,
      shortLabel: `${viewYear}.${paddedMonth}`,
    };
  });
}

const FIXED_HOLIDAYS: [number, number][] = [
  [1, 1], [3, 1], [5, 5], [6, 6], [8, 15], [10, 3], [10, 9], [12, 25],
];

const LUNAR_HOLIDAYS: Record<number, [number, number][]> = {
  2024: [[2,9],[2,10],[2,11],[2,12],[4,10],[9,16],[9,17],[9,18]],
  2025: [[1,28],[1,29],[1,30],[5,5],[5,6],[10,5],[10,6],[10,7],[10,8]],
  2026: [[2,16],[2,17],[2,18],[5,24],[9,24],[9,25],[9,26]],
  2027: [[2,6],[2,7],[2,8],[2,9],[5,13],[10,14],[10,15],[10,16]],
  2028: [[1,26],[1,27],[1,28],[5,2],[10,2],[10,3],[10,4]],
};

export function isKoreanHoliday(year: number, month: number, day: number): boolean {
  if (FIXED_HOLIDAYS.some(([m, d]) => m === month && d === day)) return true;
  return LUNAR_HOLIDAYS[year]?.some(([m, d]) => m === month && d === day) ?? false;
}
