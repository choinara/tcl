import type { CSSProperties } from 'react';
import { DAY_NAMES, getDaysInMonth, getDayOfWeek } from '../../lib/calendarUtils';

export interface MonthCalendarReferenceSeries {
  label: string;
  color?: string;
  bgColor?: string;
  /** day(1~31) → number */
  values: Record<number, number | null | undefined>;
  highlightNegative?: boolean;
}

export interface MonthCalendarProps {
  year: number;
  /** 1~12 */
  month: number;
  /** day(1~31) → number */
  value: Record<number, number>;
  onChange: (next: Record<number, number>) => void;
  disabled?: boolean;
  cellHeight?: number;
  style?: CSSProperties;
  /** 참조값 행(0개 이상). 각 항목별 라벨/색상/값 지정 */
  referenceSeries?: MonthCalendarReferenceSeries[];
  /** input 셀에 병합할 추가 스타일 */
  inputStyle?: CSSProperties;
  /** 이 값 초과 시 input에 적색 테두리 */
  maxValue?: number;
}

export function MonthCalendar({
  year, month, value, onChange,
  disabled = false,
  cellHeight,
  style,
  referenceSeries,
  inputStyle,
  maxValue,
}: MonthCalendarProps) {
  const days = getDaysInMonth(year, month);
  const firstDow = getDayOfWeek(year, month, 1);
  const trailing = (7 - ((firstDow + days) % 7)) % 7;
  const seriesCount = referenceSeries?.length ?? 0;
  const effectiveCellHeight = cellHeight ?? (50 + 15 * seriesCount);

  return (
    <div style={{
      border: '1px solid var(--color-border)', borderRadius: 4, overflow: 'hidden',
      ...style,
    }}>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)' }}>
        {DAY_NAMES.map((d, i) => (
          <div key={d} style={{
            padding: '6px 4px', textAlign: 'center', fontSize: 11, fontWeight: 600,
            backgroundColor: 'var(--color-bg)', borderBottom: '1px solid var(--color-border)',
            color: i === 0 ? 'var(--calendar-sun-color)' : i === 6 ? 'var(--calendar-sat-color)' : 'var(--color-text)',
          }}>{d}</div>
        ))}
        {Array.from({ length: firstDow }).map((_, i) => (
          <div key={`b${i}`} style={{ height: effectiveCellHeight, backgroundColor: 'var(--color-bg)' }} />
        ))}
        {Array.from({ length: days }, (_, i) => i + 1).map((d) => {
          const dow = getDayOfWeek(year, month, d);
          const isSun = dow === 0;
          const isSat = dow === 6;
          const isWeekend = isSun || isSat;
          const exceeded = maxValue != null && value[d] != null && value[d] > maxValue;
          return (
            <div key={d} style={{
              padding: 4, height: effectiveCellHeight,
              backgroundColor: isWeekend ? 'var(--color-bg)' : 'var(--color-bg-white)',
              borderRight: '1px solid var(--color-border)',
              borderBottom: '1px solid var(--color-border)',
              boxSizing: 'border-box',
            }}>
              <div style={{
                fontSize: 10, marginBottom: 2,
                color: isSun ? 'var(--calendar-sun-color)' : isSat ? 'var(--calendar-sat-color)' : 'var(--color-text-secondary)',
              }}>{d}</div>
              {referenceSeries?.map((s, sIdx) => {
                const v = s.values?.[d];
                const isNeg = s.highlightNegative && v != null && Number(v) < 0;
                return (
                  <div key={sIdx} style={{
                    fontSize: 10, height: 14, padding: '0 4px', marginBottom: 1,
                    color: isNeg ? '#dc2626' : (s.color ?? 'var(--color-text)'),
                    backgroundColor: s.bgColor ?? 'var(--color-bg)',
                    fontWeight: isNeg ? 600 : 400,
                    borderRadius: 3, lineHeight: '14px', textAlign: 'right',
                    overflow: 'hidden', whiteSpace: 'nowrap',
                  }} title={`${s.label}: ${v ?? 0}`}>
                    {v != null ? Number(v).toLocaleString('ko-KR', { maximumFractionDigits: 3 }) : '-'}
                  </div>
                );
              })}
              <input
                type="number"
                disabled={disabled}
                value={value[d] ?? ''}
                onChange={(e) => {
                  const v = e.target.value;
                  const next = { ...value };
                  if (v === '') delete next[d];
                  else next[d] = Number(v);
                  onChange(next);
                }}
                style={{
                  width: '100%', height: 22, fontSize: 11, padding: '0 4px',
                  border: exceeded ? '1px solid #dc2626' : '1px solid #d1d5db',
                  borderRadius: 3,
                  boxSizing: 'border-box', textAlign: 'right',
                  backgroundColor: disabled ? '#f3f4f6' : 'var(--color-bg-white)',
                  ...inputStyle,
                }}
              />
            </div>
          );
        })}
        {Array.from({ length: trailing }).map((_, i) => (
          <div key={`a${i}`} style={{ height: effectiveCellHeight, backgroundColor: 'var(--color-bg)' }} />
        ))}
      </div>
    </div>
  );
}
