import { useState, useMemo, useCallback } from 'react';
import { usePermission } from '@/hooks/usePermission';
import { PageTitle } from '@/components/ui/PageTitle';
import { useToast } from '@/shared/components/toast/ToastProvider';

/* ---- Types ---- */

interface ScheduleItem {
  draftId: number;
  lineCode: string;
  planDate: string;
  shift: string;
  crew: string;
  workerCount: number;
  productCode: string;
  plannedQty: number;
  taktTime: number;
  startTime: string;
  endTime: string;
}

interface PlanItem {
  planId: number;
  periodStart: string;
  periodEnd: string;
  lineCodes: string;
  status: string;
}

/* ---- 상수 ---- */

const STATUS_LABEL: Record<string, string> = {
  DRAFT: '초안', CONFIRMED: '확정', CANCELLED: '취소', REVISED: '수정',
};
const CREW_LABEL: Record<string, string> = {
  CREW_A: 'A조', CREW_B: 'B조', CREW_C: 'C조',
};
const DAY_OF_WEEK = ['일', '월', '화', '수', '목', '금', '토'];

/* 제품별 색상 (좌측 액센트 + 카드 배경) */
const PRODUCT_STYLE: Record<string, { bg: string; border: string; color: string }> = {
  CQ8:   { bg: '#eff6ff', border: '#3b82f6', color: '#1d4ed8' },
  CL6:   { bg: '#f0fdf4', border: '#10b981', color: '#065f46' },
  AB6:   { bg: '#fffbeb', border: '#f59e0b', color: '#92400e' },
  CQ6:   { bg: '#eef2ff', border: '#6366f1', color: '#4338ca' },
  PD6:   { bg: '#fdf2f8', border: '#ec4899', color: '#9d174d' },
  '4C4_S': { bg: '#f5f3ff', border: '#8b5cf6', color: '#6d28d9' },
  '4C4_L': { bg: '#f0fdfa', border: '#14b8a6', color: '#0f766e' },
};
const DEFAULT_STYLE = { bg: '#f8fafc', border: '#94a3b8', color: '#374151' };

/* ---- 목업 데이터 ---- */

function makeSchedules(planId: number, dates: string[], crewOffset: number = 0): ScheduleItem[] {
  const E_CREWS = ['CREW_A', 'CREW_B', 'CREW_C'];
  const F_CREWS = ['CREW_B', 'CREW_C', 'CREW_A'];
  const rows: ScheduleItem[] = [];
  let id = planId * 100;

  dates.forEach((date, di) => {
    const ci = (di + crewOffset) % 3;
    const nextDate = (() => {
      const d = new Date(date); d.setDate(d.getDate() + 1);
      return d.toISOString().slice(0, 10);
    })();

    rows.push({ draftId: ++id, lineCode: 'P3-E', planDate: date, shift: 'DAY',
      crew: E_CREWS[ci], workerCount: 4, productCode: 'CQ8',
      plannedQty: 928.92, taktTime: 0.7751,
      startTime: `${date} 08:00`, endTime: `${date} 20:00` });
    rows.push({ draftId: ++id, lineCode: 'P3-E', planDate: date, shift: 'NIGHT',
      crew: E_CREWS[(ci + 1) % 3], workerCount: 4, productCode: 'CQ8',
      plannedQty: 928.92, taktTime: 0.7751,
      startTime: `${date} 20:00`, endTime: `${nextDate} 08:00` });
    rows.push({ draftId: ++id, lineCode: 'P3-F', planDate: date, shift: 'DAY',
      crew: F_CREWS[ci], workerCount: 4, productCode: '4C4_S',
      plannedQty: 489.84, taktTime: 1.4698,
      startTime: `${date} 08:00`, endTime: `${date} 20:00` });
    rows.push({ draftId: ++id, lineCode: 'P3-F', planDate: date, shift: 'NIGHT',
      crew: F_CREWS[(ci + 1) % 3], workerCount: 4, productCode: '4C4_S',
      plannedQty: 489.84, taktTime: 1.4698,
      startTime: `${date} 20:00`, endTime: `${nextDate} 08:00` });
  });

  return rows;
}

const WEEK1 = ['2026-05-12', '2026-05-13', '2026-05-14', '2026-05-15', '2026-05-16'];
const WEEK2 = ['2026-05-19', '2026-05-20', '2026-05-21', '2026-05-22', '2026-05-23'];

const MOCK_PLANS: PlanItem[] = [
  { planId: 1, periodStart: '2026-05-12', periodEnd: '2026-05-16', lineCodes: 'P3-E, P3-F', status: 'CONFIRMED' },
  { planId: 2, periodStart: '2026-05-19', periodEnd: '2026-05-23', lineCodes: 'P3-E, P3-F', status: 'DRAFT' },
];

const MOCK_SCHEDULE_MAP: Record<number, ScheduleItem[]> = {
  1: makeSchedules(1, WEEK1, 0),
  2: makeSchedules(2, WEEK2, 1),
};

/* ---- 헬퍼 ---- */

function cellKey(lineCode: string, planDate: string, shift: string) {
  return `${lineCode}|${planDate}|${shift}`;
}

function calcTime(date: string, shift: string) {
  const next = new Date(date);
  next.setDate(next.getDate() + 1);
  const nd = next.toISOString().slice(0, 10);
  return shift === 'DAY'
    ? { start: `${date} 08:00`, end: `${date} 20:00` }
    : { start: `${date} 20:00`, end: `${nd} 08:00` };
}

/* ---- 스타일 헬퍼 ---- */

const thBase: React.CSSProperties = {
  border: '1px solid #e2e8f0', padding: '5px 4px',
  fontSize: 12, fontWeight: 600, textAlign: 'center',
  color: '#374151', whiteSpace: 'nowrap',
};

/* ---- Component ---- */

export default function ApsGanttPage() {
  usePermission('PM0043');
  const { notify } = useToast();

  const [selectedPlanId, setSelectedPlanId] = useState<number>(1);
  const [scheduleMap, setScheduleMap] = useState<Record<number, ScheduleItem[]>>(MOCK_SCHEDULE_MAP);

  const [draggingId, setDraggingId] = useState<number | null>(null);
  const [dragOverKey, setDragOverKey] = useState<string | null>(null);

  const schedules = useMemo(() => scheduleMap[selectedPlanId] ?? [], [scheduleMap, selectedPlanId]);
  const selectedPlan = useMemo(() => MOCK_PLANS.find(p => p.planId === selectedPlanId), [selectedPlanId]);

  const { dates, lineCodes, cellMap } = useMemo(() => {
    const dateSet = new Set<string>();
    const lineSet = new Set<string>();
    const map: Record<string, ScheduleItem> = {};
    schedules.forEach(s => {
      dateSet.add(s.planDate);
      lineSet.add(s.lineCode);
      map[cellKey(s.lineCode, s.planDate, s.shift)] = s;
    });
    return {
      dates: Array.from(dateSet).sort(),
      lineCodes: Array.from(lineSet).sort(),
      cellMap: map,
    };
  }, [schedules]);

  const lineTotals = useMemo(() => {
    const t: Record<string, number> = {};
    schedules.forEach(s => { t[s.lineCode] = (t[s.lineCode] ?? 0) + s.plannedQty; });
    return t;
  }, [schedules]);

  /* 범례: 현재 사용 중인 제품만 */
  const usedProducts = useMemo(() => {
    const set = new Set(schedules.map(s => s.productCode));
    return Array.from(set).sort();
  }, [schedules]);

  /* ---- Drag handlers ---- */

  const handleDragStart = useCallback((draftId: number) => {
    setDraggingId(draftId);
  }, []);

  const handleDragOver = useCallback((key: string, e: React.DragEvent) => {
    e.preventDefault();
    setDragOverKey(key);
  }, []);

  const handleDrop = useCallback((key: string) => {
    if (draggingId == null) return;

    setScheduleMap(prev => {
      const items = [...(prev[selectedPlanId] ?? [])];
      const [toLine, toDate, toShift] = key.split('|');
      const dragIdx = items.findIndex(s => s.draftId === draggingId);
      if (dragIdx < 0) return prev;

      const dragItem = items[dragIdx];
      const fromKey = cellKey(dragItem.lineCode, dragItem.planDate, dragItem.shift);
      if (fromKey === key) return prev; // 같은 셀로 드롭 → 무시

      const targetIdx = items.findIndex(s =>
        s.lineCode === toLine && s.planDate === toDate && s.shift === toShift,
      );

      const newItems = [...items];
      const toTime = calcTime(toDate, toShift);
      newItems[dragIdx] = {
        ...dragItem, lineCode: toLine, planDate: toDate, shift: toShift,
        startTime: toTime.start, endTime: toTime.end,
      };
      if (targetIdx >= 0 && targetIdx !== dragIdx) {
        const fromTime = calcTime(dragItem.planDate, dragItem.shift);
        newItems[targetIdx] = {
          ...items[targetIdx],
          lineCode: dragItem.lineCode, planDate: dragItem.planDate, shift: dragItem.shift,
          startTime: fromTime.start, endTime: fromTime.end,
        };
      }
      return { ...prev, [selectedPlanId]: newItems };
    });

    setDraggingId(null);
    setDragOverKey(null);
    notify('스케줄 이동 완료 (목업)', { type: 'info' });
  }, [draggingId, selectedPlanId, notify]);

  const handleDragEnd = useCallback(() => {
    setDraggingId(null);
    setDragOverKey(null);
  }, []);

  const selectStyle: React.CSSProperties = {
    height: 30, fontSize: 'var(--font-size-sm)', padding: '0 8px',
    border: '1px solid var(--color-border)', borderRadius: 4, background: '#fff',
    minWidth: 320,
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', overflow: 'hidden' }}>
      <style>{`
        .gc-cell.drag-over { background: #dbeafe !important; outline: 2px dashed #3b82f6; outline-offset: -2px; }
        .gc-card { cursor: grab; transition: opacity 0.12s, box-shadow 0.12s; user-select: none; }
        .gc-card:hover { box-shadow: 0 2px 8px rgba(0,0,0,0.16); }
        .gc-card.is-dragging { opacity: 0.35; cursor: grabbing; }
      `}</style>

      {/* Toolbar */}
      <div className="grid-toolbar">
        <PageTitle />
        <select
          value={selectedPlanId}
          onChange={e => setSelectedPlanId(Number(e.target.value))}
          style={{ ...selectStyle, marginLeft: 8 }}
        >
          {MOCK_PLANS.map(p => (
            <option key={p.planId} value={p.planId}>
              Plan #{p.planId} · {STATUS_LABEL[p.status] ?? p.status} · {p.periodStart} ~ {p.periodEnd} ({p.lineCodes})
            </option>
          ))}
        </select>
        {selectedPlan && (
          <span style={{ fontSize: 12, color: '#64748b', marginLeft: 8 }}>
            {schedules.length}건
          </span>
        )}
        <span style={{ marginLeft: 'auto', fontSize: 11, color: '#94a3b8' }}>
          카드를 드래그해 교대/호기를 변경할 수 있습니다
        </span>
      </div>

      {/* 범례 */}
      <div style={{ display: 'flex', gap: 10, padding: '4px 12px', flexShrink: 0, flexWrap: 'wrap' }}>
        {usedProducts.map(code => {
          const s = PRODUCT_STYLE[code] ?? DEFAULT_STYLE;
          return (
            <span key={code} style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 11 }}>
              <span style={{ width: 10, height: 10, background: s.border, borderRadius: 2, display: 'inline-block' }} />
              <span style={{ color: '#374151' }}>{code}</span>
            </span>
          );
        })}
      </div>

      {/* Gantt 테이블 */}
      <div style={{ flex: 1, overflow: 'auto' }}>
        <table style={{ borderCollapse: 'collapse', tableLayout: 'fixed' }}>
          <colgroup>
            <col style={{ width: 96 }} />
            {dates.flatMap((_d, di) => [
              <col key={`d${di}a`} style={{ width: 136 }} />,
              <col key={`d${di}b`} style={{ width: 136 }} />,
            ])}
          </colgroup>
          <thead style={{ position: 'sticky', top: 0, zIndex: 10 }}>
            {/* 날짜 행 */}
            <tr>
              <th style={{ ...thBase, background: '#f8fafc', rowSpan: 2 }} rowSpan={2}>호기</th>
              {dates.map(date => {
                const dow = DAY_OF_WEEK[new Date(date).getDay()];
                const isWeekend = new Date(date).getDay() === 0 || new Date(date).getDay() === 6;
                return (
                  <th key={date} colSpan={2} style={{
                    ...thBase,
                    background: isWeekend ? '#fef2f2' : '#f1f5f9',
                    color: isWeekend ? '#dc2626' : '#374151',
                  }}>
                    {date.slice(5)} ({dow})
                  </th>
                );
              })}
            </tr>
            {/* 교대 행 */}
            <tr>
              {dates.flatMap(date => [
                <th key={`${date}-DAY`} style={{ ...thBase, background: '#fafafa' }}>주간</th>,
                <th key={`${date}-NIGHT`} style={{ ...thBase, background: '#e8ecf0' }}>야간</th>,
              ])}
            </tr>
          </thead>
          <tbody>
            {lineCodes.map(lineCode => (
              <tr key={lineCode}>
                {/* 호기 셀 (좌측 고정) */}
                <td style={{
                  border: '1px solid #e2e8f0', padding: '6px 8px',
                  fontWeight: 700, fontSize: 13, textAlign: 'center',
                  background: '#f8fafc', verticalAlign: 'middle',
                  position: 'sticky', left: 0, zIndex: 5,
                }}>
                  <div>{lineCode}</div>
                  <div style={{ fontSize: 10, fontWeight: 400, color: '#64748b', marginTop: 2 }}>
                    계 {(lineTotals[lineCode] ?? 0).toLocaleString(undefined, { maximumFractionDigits: 0 })} kg
                  </div>
                </td>

                {/* 교대별 셀 */}
                {dates.flatMap(planDate =>
                  ['DAY', 'NIGHT'].map(shift => {
                    const key = cellKey(lineCode, planDate, shift);
                    const item = cellMap[key];
                    const isOver = dragOverKey === key;
                    const isDragging = item?.draftId === draggingId;
                    const ps = item ? (PRODUCT_STYLE[item.productCode] ?? DEFAULT_STYLE) : null;

                    return (
                      <td
                        key={key}
                        className={`gc-cell${isOver ? ' drag-over' : ''}`}
                        style={{
                          border: '1px solid #e2e8f0',
                          padding: 4,
                          verticalAlign: 'top',
                          background: shift === 'NIGHT' ? '#f6f8fa' : '#ffffff',
                          height: 110,
                        }}
                        onDragOver={e => handleDragOver(key, e)}
                        onDragLeave={() => setDragOverKey(null)}
                        onDrop={() => handleDrop(key)}
                      >
                        {item && ps && (
                          <div
                            className={`gc-card${isDragging ? ' is-dragging' : ''}`}
                            draggable
                            onDragStart={() => handleDragStart(item.draftId)}
                            onDragEnd={handleDragEnd}
                            style={{
                              height: '100%',
                              background: ps.bg,
                              borderLeft: `4px solid ${ps.border}`,
                              borderRadius: 4,
                              padding: '5px 7px',
                              fontSize: 12,
                              lineHeight: 1.55,
                              boxSizing: 'border-box',
                            }}
                          >
                            <div style={{ fontWeight: 700, color: ps.color, fontSize: 13 }}>
                              {item.productCode}
                            </div>
                            <div style={{ color: '#374151' }}>
                              {CREW_LABEL[item.crew] ?? item.crew} · {item.workerCount}명
                            </div>
                            <div style={{ color: '#374151', fontVariantNumeric: 'tabular-nums' }}>
                              {item.plannedQty.toLocaleString(undefined, { maximumFractionDigits: 0 })} kg
                            </div>
                            <div style={{ color: '#94a3b8', fontSize: 10, marginTop: 2 }}>
                              {item.startTime.slice(-5)} ~ {item.endTime.slice(-5)}
                            </div>
                            <div style={{ color: '#94a3b8', fontSize: 10 }}>
                              Takt {item.taktTime.toFixed(4)} min/kg
                            </div>
                          </div>
                        )}
                      </td>
                    );
                  }),
                )}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
