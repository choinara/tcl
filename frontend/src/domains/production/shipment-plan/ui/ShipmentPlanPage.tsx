import { useState, useMemo, useCallback } from 'react';
import { AllCommunityModule, ModuleRegistry, type ColDef, type CellClickedEvent } from 'ag-grid-community';
import { AgGridReact } from 'ag-grid-react';
ModuleRegistry.registerModules([AllCommunityModule]);
import { usePermission } from '@/hooks/usePermission';
import { PageTitle } from '@/components/ui/PageTitle';
import { MonthCalendar } from '@/components/ui/MonthCalendar';
import type { MonthCalendarReferenceSeries } from '@/components/ui/MonthCalendar';
import { GridFill } from '@/components/layout/GridFill';
import { TabBar } from '@/components/layout/TabBar';

const MENU_CODE = 'PM0050';

/* ── 탭 타입 ── */
type ShipmentTab = 'daily' | 'weekly' | 'monthly';

const SHIPMENT_TABS: { key: ShipmentTab; label: string }[] = [
  { key: 'daily', label: '일별' },
  { key: 'weekly', label: '주별' },
  { key: 'monthly', label: '월별' },
];

/* ── 행 타입 ── */
type RowType = '수요' | '재고' | '필요수량' | '설비케파' | '출하계획' | '미충족';

const ROW_TYPES: RowType[] = ['수요', '재고', '필요수량', '설비케파', '출하계획', '미충족'];

/* ── 그리드 행 ── */
interface GridRow {
  id: string;
  _itemKey: string;
  rowType: RowType;
  customerCode: string;
  productCode: string;
  productName: string;
  spec: string;
  [key: string]: unknown;
}

/* ── 출하계획 편집 팝업 ── */
interface PlanEditPopup {
  itemKey: string;
  customerCode: string;
  productCode: string;
  months: {
    year: number;
    month: number;
    quantities: Record<number, number>;
    demandSeries: Record<number, number>;
    inventorySeries: Record<number, number>;
    needSeries: Record<number, number>;
    capacitySeries: Record<number, number>;
  }[];
}

/* ── 설비케파 편집 팝업 ── */
interface CapacityEditPopup {
  itemKey: string;
  year: number;
  month: number;
  quantities: Record<number, number>;
  maxCapacity: number | null;
}

/* ── 행 색상 ── */
const ROW_BG: Record<RowType, string> = {
  '수요':     '#f3f4f6',
  '재고':     '#f0fdf4',
  '필요수량': '#eff6ff',
  '설비케파': '#fff7ed',
  '출하계획': '#fef3c7',
  '미충족':   '#fef2f2',
};

const ROW_COLOR: Record<RowType, string> = {
  '수요':     '#374151',
  '재고':     '#166534',
  '필요수량': '#1e40af',
  '설비케파': '#9a3412',
  '출하계획': '#78350f',
  '미충족':   '#991b1b',
};

/* ── 스텁 데이터 ── */
const STUB_ITEMS = [
  { customerCode: 'C001', productCode: 'P001', productName: '제품A', spec: '100×200' },
  { customerCode: 'C002', productCode: 'P002', productName: '제품B', spec: '150×300' },
];

function buildDailyRows(year: number, month: number): GridRow[] {
  const rows: GridRow[] = [];
  let idx = 0;
  const days = new Date(year, month, 0).getDate();

  for (const item of STUB_ITEMS) {
    const key = `${item.customerCode}-${item.productCode}`;
    for (const rowType of ROW_TYPES) {
      const row: GridRow = {
        id: `d-${key}-${rowType}-${idx++}`,
        _itemKey: key,
        rowType,
        customerCode: item.customerCode,
        productCode: item.productCode,
        productName: item.productName,
        spec: item.spec,
      };
      for (let d = 1; d <= days; d++) row[`d${d}`] = null;
      rows.push(row);
    }
  }
  return rows;
}

function buildWeeklyRows(): GridRow[] {
  const rows: GridRow[] = [];
  let idx = 0;

  for (const item of STUB_ITEMS) {
    const key = `${item.customerCode}-${item.productCode}`;
    for (const rowType of ROW_TYPES) {
      const row: GridRow = {
        id: `w-${key}-${rowType}-${idx++}`,
        _itemKey: key,
        rowType,
        customerCode: item.customerCode,
        productCode: item.productCode,
        productName: item.productName,
        spec: item.spec,
      };
      for (let w = 1; w <= 5; w++) row[`w${w}`] = null;
      rows.push(row);
    }
  }
  return rows;
}

function buildMonthlyRows(): GridRow[] {
  const rows: GridRow[] = [];
  let idx = 0;

  for (const item of STUB_ITEMS) {
    const key = `${item.customerCode}-${item.productCode}`;
    for (const rowType of ROW_TYPES) {
      const row: GridRow = {
        id: `m-${key}-${rowType}-${idx++}`,
        _itemKey: key,
        rowType,
        customerCode: item.customerCode,
        productCode: item.productCode,
        productName: item.productName,
        spec: item.spec,
      };
      for (let m = 1; m <= 12; m++) row[`m${m}`] = null;
      rows.push(row);
    }
  }
  return rows;
}

/* ── 셀 스타일 ── */
function dataCellStyle(params: { data?: unknown; value?: unknown }) {
  const row = params.data as GridRow | undefined;
  if (!row) return {};
  if (row.rowType === '미충족' && params.value != null) {
    const v = Number(params.value);
    if (v < 0) return { backgroundColor: ROW_BG['미충족'], color: '#dc2626', fontWeight: 600 };
    if (v > 0) return { backgroundColor: ROW_BG['미충족'], color: '#2563eb', fontWeight: 600 };
  }
  return { backgroundColor: ROW_BG[row.rowType], color: ROW_COLOR[row.rowType] };
}

function dataValueFormatter(p: { data?: unknown; value: unknown }) {
  if (p.value == null || p.value === '') return '';
  const num = Number(p.value);
  if (isNaN(num)) return '';
  const formatted = num.toLocaleString('ko-KR', { maximumFractionDigits: 3 });
  const row = p.data as GridRow | undefined;
  if (row?.rowType === '필요수량' && num > 0) return '+' + formatted;
  if (row?.rowType === '미충족' && num !== 0) return (num > 0 ? '+' : '') + formatted;
  return formatted;
}

/* ── 고정 컬럼 정의 ── */
const FIXED_COLS: ColDef<GridRow>[] = [
  {
    field: 'rowType', headerName: '구분', width: 80, pinned: 'left', editable: false,
    cellStyle: (p) => {
      const row = p.data as GridRow | undefined;
      if (!row) return {};
      return { backgroundColor: ROW_BG[row.rowType], color: ROW_COLOR[row.rowType], fontWeight: 600, fontSize: 11 };
    },
  },
  { field: 'customerCode', headerName: '고객사', width: 80, pinned: 'left', editable: false },
  { field: 'productCode',  headerName: '제품코드', width: 90, pinned: 'left', editable: false },
  { field: 'productName',  headerName: '제품명',  width: 100, pinned: 'left', editable: false },
  { field: 'spec',         headerName: '규격',    width: 110, pinned: 'left', editable: false },
];

export default function ShipmentPlanPage() {
  const perm = usePermission(MENU_CODE);

  const now = new Date();
  const [year, setYear] = useState(now.getFullYear());
  const [month, setMonth] = useState(now.getMonth() + 1);
  const [tab, setTab] = useState<ShipmentTab>('daily');

  const [planEditPopup, setPlanEditPopup] = useState<PlanEditPopup | null>(null);
  const [capacityEditPopup, setCapacityEditPopup] = useState<CapacityEditPopup | null>(null);

  /* ── 그리드 데이터 ── */
  const rowData = useMemo<GridRow[]>(() => {
    if (tab === 'daily')   return buildDailyRows(year, month);
    if (tab === 'weekly')  return buildWeeklyRows();
    return buildMonthlyRows();
  }, [tab, year, month]);

  /* ── 날짜 컬럼 ── */
  const dateCols = useMemo<ColDef<GridRow>[]>(() => {
    const days = new Date(year, month, 0).getDate();
    if (tab === 'daily') {
      return Array.from({ length: days }, (_, i) => {
        const d = i + 1;
        const dow = new Date(year, month - 1, d).getDay();
        const isWeekend = dow === 0 || dow === 6;
        return {
          field: `d${d}` as keyof GridRow,
          headerName: `${month}/${d}`,
          width: 58,
          editable: (p) => (p.data as GridRow).rowType === '출하계획',
          cellDataType: 'number',
          cellStyle: (p) => ({
            ...dataCellStyle(p),
            ...(isWeekend ? { opacity: 0.7 } : {}),
          }),
          valueFormatter: dataValueFormatter,
        };
      });
    }
    if (tab === 'weekly') {
      return Array.from({ length: 5 }, (_, i) => ({
        field: `w${i + 1}` as keyof GridRow,
        headerName: `W${i + 1}`,
        width: 80,
        editable: false,
        cellDataType: 'number',
        cellStyle: dataCellStyle,
        valueFormatter: dataValueFormatter,
      }));
    }
    return Array.from({ length: 12 }, (_, i) => ({
      field: `m${i + 1}` as keyof GridRow,
      headerName: `${i + 1}월`,
      width: 80,
      editable: false,
      cellDataType: 'number',
      cellStyle: dataCellStyle,
      valueFormatter: dataValueFormatter,
    }));
  }, [tab, year, month]);

  const columnDefs = useMemo(() => [...FIXED_COLS, ...dateCols], [dateCols]);

  /* ── 행 클릭: 설비케파 or 출하계획 팝업 열기 ── */
  const handleCellClicked = useCallback((e: CellClickedEvent<GridRow>) => {
    const row = e.data;
    if (!row || !row._itemKey) return;
    if (!perm.canUpdate) return;

    if (row.rowType === '설비케파') {
      setCapacityEditPopup({
        itemKey: row._itemKey,
        year,
        month,
        quantities: {},
        maxCapacity: null,
      });
    } else if (row.rowType === '출하계획') {
      const months = Array.from({ length: 3 }, (_, i) => {
        const d = new Date(year, month - 1 + i, 1);
        return {
          year: d.getFullYear(),
          month: d.getMonth() + 1,
          quantities: {},
          demandSeries: {},
          inventorySeries: {},
          needSeries: {},
          capacitySeries: {},
        };
      });
      setPlanEditPopup({
        itemKey: row._itemKey,
        customerCode: row.customerCode,
        productCode: row.productCode,
        months,
      });
    }
  }, [perm.canUpdate, year, month]);

  /* ── 출하계획 저장 (stub) ── */
  const handlePlanEditConfirm = (popup: PlanEditPopup) => {
    console.info('출하계획 저장 (stub):', popup);
    setPlanEditPopup(null);
  };

  /* ── 설비케파 저장 (stub) ── */
  const handleCapacityConfirm = (popup: CapacityEditPopup) => {
    console.info('설비케파 저장 (stub):', popup);
    setCapacityEditPopup(null);
  };

  const getRowStyle = useCallback((params: { data?: Record<string, unknown> }) => {
    const row = params.data as GridRow | undefined;
    if (!row) return {};
    if (row.rowType === '수요') return { borderTop: '2px solid #d1d5db' };
    return {};
  }, []);

  if (!perm.canRead) return null;

  return (
    <div className="flex flex-col h-full">
      <PageTitle menuCode={MENU_CODE} />

      {/* 조회 바 */}
      <div className="flex items-center gap-2 px-3 py-2 border-b border-[var(--color-border)] bg-[var(--color-bg)] flex-wrap">
        <span className="text-xs font-semibold text-[var(--color-text-secondary)]">조회연월</span>
        <input
          type="month"
          className="h-8 text-sm border border-[var(--color-border)] rounded px-2"
          value={`${year}-${String(month).padStart(2, '0')}`}
          onChange={(e) => {
            const [y, m] = e.target.value.split('-').map(Number);
            if (y && m) { setYear(y); setMonth(m); }
          }}
        />
        <button className="mes-btn">조회</button>
      </div>

      {/* 탭 */}
      <TabBar
        tabs={SHIPMENT_TABS.map(t => ({ key: t.key, label: t.label }))}
        active={tab}
        onChange={(k) => setTab(k as ShipmentTab)}
      />

      {/* 범례 */}
      <div className="flex items-center gap-3 px-3 py-1 border-b border-[var(--color-border)] flex-wrap">
        {ROW_TYPES.map(rt => (
          <div key={rt} className="flex items-center gap-1">
            <span style={{ display: 'inline-block', width: 10, height: 10, borderRadius: 2, backgroundColor: ROW_BG[rt], border: `1px solid ${ROW_COLOR[rt]}` }} />
            <span style={{ color: ROW_COLOR[rt], fontSize: 11, fontWeight: 600 }}>{rt}</span>
          </div>
        ))}
        {perm.canUpdate && (
          <span className="ml-auto text-xs text-[var(--color-text-secondary)]">설비케파 / 출하계획 행 클릭 시 수정</span>
        )}
      </div>

      {/* 그리드 */}
      <GridFill>
        <div className="ag-theme-alpine" style={{ width: '100%', height: '100%' }}>
          <AgGridReact<GridRow>
            rowData={rowData}
            columnDefs={columnDefs}
            defaultColDef={{ resizable: true, sortable: false, suppressMovable: true }}
            rowHeight={28}
            headerHeight={34}
            suppressRowClickSelection
            getRowStyle={getRowStyle}
            onCellClicked={handleCellClicked}
          />
        </div>
      </GridFill>

      {/* ── 출하계획 수정 팝업 ── */}
      {planEditPopup && (
        <div style={{
          position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.4)',
          display: 'flex', alignItems: 'flex-start', justifyContent: 'center',
          zIndex: 9000, padding: '32px 16px', overflowY: 'auto',
        }} onClick={() => setPlanEditPopup(null)}>
          <div style={{
            background: '#fff', borderRadius: 8, padding: '20px 24px', width: 'min(1100px, 96vw)',
            boxShadow: '0 4px 24px rgba(0,0,0,0.18)',
          }} onClick={(e) => e.stopPropagation()}>
            <div style={{ marginBottom: 14, fontWeight: 700, fontSize: 15 }}>
              출하계획 수량 ({planEditPopup.months[0]?.year}년 {planEditPopup.months[0]?.month}월
              {' ~ '}{planEditPopup.months[planEditPopup.months.length - 1]?.month}월)
              <span style={{ marginLeft: 8, fontWeight: 400, fontSize: 13, color: '#6b7280' }}>
                {planEditPopup.customerCode} / {planEditPopup.productCode}
              </span>
            </div>
            <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
              {planEditPopup.months.map((m, idx) => {
                const needSeries: Record<number, number> = {};
                return (
                  <div key={m.year + '-' + m.month} style={{ flex: '1 1 300px', minWidth: 260 }}>
                    <div style={{ marginBottom: 6, fontWeight: 600, fontSize: 13 }}>
                      {m.year}년 {m.month}월
                    </div>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4, marginBottom: 6 }}>
                      {([
                        { label: '수요', color: '#374151', bgColor: '#f3f4f6', values: m.demandSeries },
                        { label: '재고', color: '#065f46', bgColor: '#d1fae5', values: m.inventorySeries },
                        { label: '필요수량', color: '#1e40af', bgColor: '#dbeafe', values: needSeries, highlightNegative: true },
                        { label: '설비케파', color: '#9a3412', bgColor: '#ffedd5', values: m.capacitySeries },
                      ] as MonthCalendarReferenceSeries[]).map(s => (
                        <div key={s.label} style={{ display: 'flex', alignItems: 'center', gap: 3, fontSize: 10 }}>
                          <span style={{ display: 'inline-block', width: 8, height: 8, borderRadius: 1, backgroundColor: s.bgColor, border: `1px solid ${s.color}` }} />
                          <span style={{ color: s.color, fontWeight: 600 }}>{s.label}</span>
                        </div>
                      ))}
                    </div>
                    <MonthCalendar
                      year={m.year}
                      month={m.month}
                      value={m.quantities}
                      referenceSeries={[
                        { label: '수요', color: '#374151', bgColor: '#f3f4f6', values: m.demandSeries },
                        { label: '재고', color: '#065f46', bgColor: '#d1fae5', values: m.inventorySeries },
                        { label: '필요수량', color: '#1e40af', bgColor: '#dbeafe', values: needSeries, highlightNegative: true },
                        { label: '설비케파', color: '#9a3412', bgColor: '#ffedd5', values: m.capacitySeries },
                      ]}
                      onChange={(next) => setPlanEditPopup(prev => {
                        if (!prev) return null;
                        const months = [...prev.months];
                        months[idx] = { ...months[idx], quantities: next };
                        return { ...prev, months };
                      })}
                    />
                  </div>
                );
              })}
            </div>
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8, marginTop: 14 }}>
              <button className="mes-btn" onClick={() => setPlanEditPopup(null)}>취소</button>
              <button className="mes-btn mes-btn-save" onClick={() => handlePlanEditConfirm(planEditPopup)}>확인</button>
            </div>
          </div>
        </div>
      )}

      {/* ── 설비케파 편집 팝업 ── */}
      {capacityEditPopup && (
        <div style={{
          position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.4)',
          display: 'flex', alignItems: 'flex-start', justifyContent: 'center',
          zIndex: 9000, padding: '32px 16px', overflowY: 'auto',
        }} onClick={() => setCapacityEditPopup(null)}>
          <div style={{
            background: '#fff', borderRadius: 8, padding: '20px 24px', width: 'min(760px, 96vw)',
            boxShadow: '0 4px 24px rgba(0,0,0,0.18)',
          }} onClick={(e) => e.stopPropagation()}>
            <div style={{ marginBottom: 14, fontWeight: 700, fontSize: 15 }}>
              설비케파 편집 — {capacityEditPopup.year}년 {capacityEditPopup.month}월
            </div>
            <MonthCalendar
              year={capacityEditPopup.year}
              month={capacityEditPopup.month}
              value={capacityEditPopup.quantities}
              onChange={(next) => setCapacityEditPopup(prev => prev ? { ...prev, quantities: next } : null)}
              maxValue={capacityEditPopup.maxCapacity ?? undefined}
              referenceSeries={capacityEditPopup.maxCapacity != null ? [{
                label: '최대',
                color: '#dc2626',
                values: Object.fromEntries(
                  Array.from({ length: new Date(capacityEditPopup.year, capacityEditPopup.month, 0).getDate() }, (_, i) => [i + 1, capacityEditPopup.maxCapacity])
                ),
              }] : undefined}
            />
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8, marginTop: 16 }}>
              <button className="mes-btn" onClick={() => setCapacityEditPopup(null)}>취소</button>
              <button className="mes-btn mes-btn-save" onClick={() => handleCapacityConfirm(capacityEditPopup)}>확인</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
