/**
 * [TS0050] T03 월별 일자 매트릭스 데모
 * 헤더 3단계: 월명(26년 1월) → W1~W5 → 일자(1~31)
 * 주말 셀 강조, 월요일 기준 주차 분리
 */

import { useState, useMemo, useCallback } from 'react';
import type { ColDef, ColGroupDef } from 'ag-grid-community';
import { useTranslation } from 'react-i18next';
import { usePermission } from '@/hooks/usePermission';
import { useToast } from '@/shared/components/toast/ToastProvider';
import { PageTitle } from '@/components/ui/PageTitle';
import { PeakEditGrid } from '@/components/grid';

const MENU_CODE = 'TS0050';

/* ── 날짜 헬퍼 ── */

interface DayMeta {
  field: string;
  day: number;
  dow: number;
  isWeekend: boolean;
  weekInMonth: number;
}

function getDaysInMonth(year: number, month: number) {
  return new Date(year, month, 0).getDate();
}

function getDayOfWeek(year: number, month: number, day: number) {
  return new Date(year, month - 1, day).getDay();
}

function getWeekInMonth(year: number, month: number, day: number) {
  const firstDow = getDayOfWeek(year, month, 1);
  const offsetToMonday = firstDow === 0 ? 6 : firstDow - 1;
  return Math.floor((day - 1 + offsetToMonday) / 7) + 1;
}

function buildDayMeta(year: number, month: number): DayMeta[] {
  const days = getDaysInMonth(year, month);
  return Array.from({ length: days }, (_, i) => {
    const day = i + 1;
    const dow = getDayOfWeek(year, month, day);
    return {
      field: `d_${day}`,
      day,
      dow,
      isWeekend: dow === 0 || dow === 6,
      weekInMonth: getWeekInMonth(year, month, day),
    };
  });
}

function buildMonthColumnGroup(year: number, month: number, dayMeta: DayMeta[]): ColGroupDef {
  const weekMap = new Map<number, DayMeta[]>();
  for (const col of dayMeta) {
    if (!weekMap.has(col.weekInMonth)) weekMap.set(col.weekInMonth, []);
    weekMap.get(col.weekInMonth)!.push(col);
  }

  const weekChildren: ColGroupDef[] = [];
  for (const [wk, cols] of weekMap) {
    weekChildren.push({
      headerName: `W${wk}`,
      headerClass: 'ag-header-group-center',
      children: cols.map(
        (col): ColDef => ({
          field: col.field,
          headerName: String(col.day),
          width: 45,
          cellDataType: 'number',
          editable: true,
          headerClass: col.dow === 0
            ? 't03-header-sunday'
            : col.dow === 6
              ? 't03-header-saturday'
              : '',
          cellStyle: () =>
            col.isWeekend ? { backgroundColor: '#fef3e8' } : {},
          valueFormatter: (p) => {
            if (p.value == null || p.value === '') return '';
            const n = Number(p.value);
            return isNaN(n) ? '' : n.toLocaleString();
          },
          valueParser: (p) => {
            if (p.newValue === '' || p.newValue == null) return null;
            const n = Number(p.newValue);
            return isNaN(n) ? null : n;
          },
        }),
      ),
    });
  }

  return {
    headerName: `${year % 100}년 ${month}월`,
    headerClass: 'ag-header-group-center t03-header-month',
    children: weekChildren,
  };
}

/* ── 목업 데이터 ── */

interface GridRow {
  id: number;
  lineCode: string;
  productName: string;
  planType: string;
  [key: string]: unknown;
}

function buildMockData(year: number, month: number): GridRow[] {
  const days = getDaysInMonth(year, month);
  const lines = [
    { lineCode: 'P1', productName: 'CQ 0.2T', planType: '계획' },
    { lineCode: 'P1', productName: 'CQ 0.2T', planType: '실적' },
    { lineCode: 'P2', productName: 'AQ 0.3T', planType: '계획' },
    { lineCode: 'P2', productName: 'AQ 0.3T', planType: '실적' },
  ];
  return lines.map((l, idx) => {
    const row: GridRow = { id: idx + 1, ...l };
    for (let d = 1; d <= days; d++) {
      const dow = getDayOfWeek(year, month, d);
      const isWeekend = dow === 0 || dow === 6;
      if (!isWeekend && l.planType === '계획') {
        row[`d_${d}`] = Math.floor(Math.random() * 50 + 10);
      } else {
        row[`d_${d}`] = null;
      }
    }
    return row;
  });
}

/* ── 컴포넌트 ── */

export default function TemplateT03DemoPage() {
  const { t } = useTranslation();
  const { notify } = useToast();
  const perm = usePermission(MENU_CODE);

  const [year, setYear] = useState(() => new Date().getFullYear());
  const [month, setMonth] = useState(() => new Date().getMonth() + 1);

  const dayMeta = useMemo(() => buildDayMeta(year, month), [year, month]);

  const [data, setData] = useState<GridRow[]>(() =>
    buildMockData(new Date().getFullYear(), new Date().getMonth() + 1),
  );

  const handleYearChange = (y: number) => {
    setYear(y);
    setData(buildMockData(y, month));
  };
  const handleMonthChange = (m: number) => {
    setMonth(m);
    setData(buildMockData(year, m));
  };

  const columns = useMemo<(ColDef | ColGroupDef)[]>(() => {
    const fixed: ColDef<GridRow>[] = [
      { field: 'lineCode',    headerName: 'Line',  width: 70,  pinned: 'left', editable: false },
      { field: 'productName', headerName: '제품명', width: 110, pinned: 'left', editable: false },
      {
        field: 'planType', headerName: '구분', width: 65, pinned: 'left', editable: false,
        cellStyle: (p) => (p.value === '실적' ? { color: '#16a34a' } : {}),
      },
    ];
    const monthGroup = buildMonthColumnGroup(year, month, dayMeta);
    return [...fixed, monthGroup];
  }, [year, month, dayMeta]);

  const handleBatchSave = useCallback(async () => {
    notify('(데모) 저장 완료', { type: 'success' });
  }, [notify]);

  const selectStyle: React.CSSProperties = {
    height: 28,
    fontSize: 'var(--font-size-sm)',
    padding: '0 8px',
    border: '1px solid var(--color-border)',
    borderRadius: 4,
    background: '#fff',
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', gap: 8, overflow: 'hidden' }}>
      <div className="grid-toolbar">
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <PageTitle />
          <select value={year} onChange={(e) => handleYearChange(Number(e.target.value))} style={selectStyle}>
            {[2024, 2025, 2026, 2027].map((y) => (
              <option key={y} value={y}>{y}년</option>
            ))}
          </select>
          <select value={month} onChange={(e) => handleMonthChange(Number(e.target.value))} style={selectStyle}>
            {Array.from({ length: 12 }, (_, i) => i + 1).map((m) => (
              <option key={m} value={m}>{m}월</option>
            ))}
          </select>
        </div>
      </div>

      <div style={{ flex: 1, overflow: 'auto' }}>
        <PeakEditGrid
          gridId={`${MENU_CODE}-t03`}
          columns={columns}
          data={data as Record<string, unknown>[]}
          onBatchSave={handleBatchSave}
          hideRowNumber
          autoHeight
          permission={perm}
          excelFileName={`T03_데모_${year}년${month}월`}
        />
      </div>

      <style>{`
        .t03-header-sunday .ag-header-cell-label { color: #e11d48 !important; }
        .t03-header-saturday .ag-header-cell-label { color: #2563eb !important; }
        .t03-header-month .ag-header-group-cell-label,
        .ag-header-group-center .ag-header-group-cell-label {
          justify-content: center !important;
        }
      `}</style>
    </div>
  );
}
