import { useState, useMemo, useCallback, useRef, useEffect } from 'react';
import { usePermission } from '@/hooks/usePermission';
import { PageTitle } from '@/components/ui/PageTitle';
import { PeakEditGrid } from '@/components/grid';
import type { PeakEditGridRef } from '@/components/grid';
import type { ColDef, ColGroupDef } from 'ag-grid-community';
import { useToast } from '@/shared/components/toast/ToastProvider';
import { useConfirm } from '@/components/ui/ConfirmDialog';
import { authFetch } from '@/lib/api';
import { downloadDailyPlanTemplate } from '../utils/generateDailyPlanTemplate';
import { parseDailyPlanExcel } from '../utils/parseDailyPlanExcel';

/* ── Types ── */

interface PlanRow {
  id: string;
  customer: string;
  lineCode: string;
  productName: string;
  spec: string;
  material: string;
  planType: '계획' | '실적';
  quantities: Record<string, number>; // m0_d1, m0_d2, ..., m2_d31
}

type RowKind = 'data' | 'subtotal' | 'grandTotal';

interface GridRow {
  id: string;
  rowKind: RowKind;
  __isTotal?: boolean;
  _lineCode?: string;
  customer: string;
  lineCode: string;
  productName: string;
  spec: string;
  material: string;
  planType: string;
  [key: string]: unknown;
}

interface RawMaterialItem {
  id: number;
  materialType: string;
  modelName: string;
  rawMaterial: string;
  productSpec: string;
}

/* ── Constants ── */

const DAY_NAMES = ['일', '월', '화', '수', '목', '금', '토'];

/* ── Date helpers ── */

function getDaysInMonth(year: number, month: number): number {
  return new Date(year, month, 0).getDate();
}

function getDayOfWeek(year: number, month: number, day: number): number {
  return new Date(year, month - 1, day).getDay();
}

function getISOWeekNumber(year: number, month: number, day: number): number {
  const date = new Date(year, month - 1, day);
  const dayOfWeek = date.getDay() || 7;
  date.setDate(date.getDate() + 4 - dayOfWeek);
  const yearStart = new Date(date.getFullYear(), 0, 1);
  return Math.ceil(((date.getTime() - yearStart.getTime()) / 86400000 + 1) / 7);
}

/** 요일별 헤더 CSS 클래스 */
function getDayHeaderClass(dow: number): string {
  if (dow === 0) return 'dp-header-sunday';
  if (dow === 6) return 'dp-header-saturday';
  return '';
}

/** 주말 셀 배경색 (수주등록과 동일) */
function getDayCellBg(dow: number): string {
  if (dow === 0 || dow === 6) return '#f1f5f9';
  return '';
}

/** 3개월 (year, month) 쌍 계산 */
function calcThreeMonths(year: number, month: number): { year: number; month: number }[] {
  const result: { year: number; month: number }[] = [];
  for (let i = 0; i < 3; i++) {
    const m = ((month - 1 + i) % 12) + 1;
    const y = year + Math.floor((month - 1 + i) / 12);
    result.push({ year: y, month: m });
  }
  return result;
}

/** 3개월 일자 메타 생성 */
interface DayMeta {
  field: string; monthIdx: number; month: number; day: number;
  year: number; weekNum: number; dow: number; isWeekend: boolean;
}

function buildDayMeta(year: number, startMonth: number): DayMeta[] {
  const months = calcThreeMonths(year, startMonth);
  const cols: DayMeta[] = [];
  for (let m = 0; m < 3; m++) {
    const { year: yr, month: mo } = months[m];
    const days = getDaysInMonth(yr, mo);
    for (let d = 1; d <= days; d++) {
      const dow = getDayOfWeek(yr, mo, d);
      cols.push({
        field: `m${m}_d${d}`, monthIdx: m, month: mo, day: d, year: yr,
        weekNum: getISOWeekNumber(yr, mo, d), dow, isWeekend: dow === 0 || dow === 6,
      });
    }
  }
  return cols;
}

/** 3단 헤더 컬럼 그룹 생성: W주차 → 요일명 → 일자번호 */
function buildDayColumnGroups(
  dayMeta: DayMeta[],
  rowKindStyle: (params: { data?: unknown }, base?: Record<string, unknown>) => Record<string, unknown>,
): ColGroupDef[] {
  // 주차별로 그룹핑
  const weekGroups: { weekKey: string; weekNum: number; days: DayMeta[] }[] = [];
  let currentWeek: DayMeta[] = [];
  let currentWeekKey = '';

  for (const col of dayMeta) {
    const wk = `${col.year}-W${col.weekNum}`;
    if (wk !== currentWeekKey) {
      if (currentWeek.length > 0) {
        weekGroups.push({ weekKey: currentWeekKey, weekNum: currentWeek[0].weekNum, days: currentWeek });
      }
      currentWeek = [col];
      currentWeekKey = wk;
    } else {
      currentWeek.push(col);
    }
  }
  if (currentWeek.length > 0) {
    weekGroups.push({ weekKey: currentWeekKey, weekNum: currentWeek[0].weekNum, days: currentWeek });
  }

  return weekGroups.map((wg) => ({
    headerName: `W${wg.weekNum}`,
    headerClass: 'ag-header-group-center',
    children: wg.days.map((col) => {
      const dayLabel = DAY_NAMES[col.dow];
      const headerClass = getDayHeaderClass(col.dow);
      const cellBg = getDayCellBg(col.dow);
      return {
        field: col.field,
        headerName: `${col.month}/${col.day}`,
        headerTooltip: `${col.month}/${col.day}(${dayLabel})`,
        width: 55,
        cellDataType: 'number',
        editable: (params: { data: unknown }) => {
          const row = params.data as GridRow;
          return row?.rowKind === 'data' && row?.planType === '계획';
        },
        headerClass,
        cellStyle: (params: { data?: unknown }) => {
          const base = cellBg ? { backgroundColor: cellBg } : {};
          return rowKindStyle(params, base);
        },
        valueFormatter: (p: { value: unknown }) => {
          if (p.value == null) return '';
          const num = Number(p.value);
          return Number.isInteger(num) ? num.toLocaleString() : num.toFixed(1);
        },
        valueParser: (p: { newValue: unknown }) => {
          if (p.newValue === '' || p.newValue == null) return null;
          const num = Number(p.newValue);
          return isNaN(num) ? null : Math.round(num * 10) / 10;
        },
      } as ColDef;
    }),
  }));
}

/* ── Build grid rows ── */

function buildGridRows(allRows: PlanRow[], year: number, startMonth: number): GridRow[] {
  const dayMeta = buildDayMeta(year, startMonth);
  const lineOrder = ['P1', 'Q,R', 'P2', 'O,P', 'P3', 'P4', 'P5', 'E,F', 'P6', 'G,H', 'S1', 'S2'];

  const grouped = new Map<string, PlanRow[]>();
  for (const line of lineOrder) {
    const lineRows = allRows.filter((r) => r.lineCode === line);
    if (lineRows.length > 0) grouped.set(line, lineRows);
  }
  const ungrouped = allRows.filter((r) => !lineOrder.includes(r.lineCode));
  if (ungrouped.length > 0) {
    const otherLines = [...new Set(ungrouped.map((r) => r.lineCode))];
    for (const line of otherLines) {
      grouped.set(line, ungrouped.filter((r) => r.lineCode === line));
    }
  }

  const result: GridRow[] = [];
  const grandTotals: Record<string, number> = {};

  for (const [line, lineRows] of grouped) {
    const subtotals: Record<string, number> = {};

    for (const row of lineRows) {
      const gridRow: GridRow = {
        id: row.id, rowKind: 'data', _lineCode: line,
        customer: row.customer, lineCode: line, productName: row.productName,
        spec: row.spec, material: row.material, planType: row.planType,
      };
      for (const col of dayMeta) {
        const val = row.quantities[col.field] ?? null;
        gridRow[col.field] = val;
        if (val != null && row.planType === '계획') {
          subtotals[col.field] = (subtotals[col.field] as number ?? 0) + (val as number);
          grandTotals[col.field] = (grandTotals[col.field] as number ?? 0) + (val as number);
        }
      }
      result.push(gridRow);
    }

    const subtotalRow: GridRow = {
      id: `st-${line}`, rowKind: 'subtotal',
      customer: '', lineCode: '', productName: '', spec: '',
      material: `${line} 소계`, planType: '',
    };
    for (const col of dayMeta) subtotalRow[col.field] = subtotals[col.field] ?? null;
    result.push(subtotalRow);
  }

  if (result.length === 0) {
    const emptyRow: GridRow = {
      id: 'empty-plan', rowKind: 'data', _lineCode: '',
      customer: '', lineCode: '', productName: '', spec: '', material: '', planType: '계획',
    };
    for (const col of dayMeta) emptyRow[col.field] = null;
    result.push(emptyRow);
  }

  const grandTotalRow: GridRow = {
    id: 'gt-all', rowKind: 'grandTotal', __isTotal: true,
    customer: '', lineCode: '', productName: '', spec: '', material: '합계', planType: '',
  };
  for (const col of dayMeta) grandTotalRow[col.field] = grandTotals[col.field] ?? null;
  result.push(grandTotalRow);

  return result;
}

/* ── Component ── */

export default function DailyProductionPlanPage() {
  const perm = usePermission('PM0030');
  const { notify } = useToast();
  const { confirm: confirmDialog, ConfirmDialog } = useConfirm();
  const gridRef = useRef<PeakEditGridRef>(null);

  const [year, setYear] = useState(() => new Date().getFullYear());
  const [month, setMonth] = useState(() => new Date().getMonth() + 1);
  const [rows, setRows] = useState<PlanRow[]>([]);
  const [rawMaterials, setRawMaterials] = useState<RawMaterialItem[]>([]);
  const [addRowPopup, setAddRowPopup] = useState(false);
  const [templatePopup, setTemplatePopup] = useState(false);

  const dayMeta = useMemo(() => buildDayMeta(year, month), [year, month]);

  // 원자재 기준정보 로드
  useEffect(() => {
    (async () => {
      try {
        const res = await authFetch('/api/master/raw-materials');
        if (res.ok) {
          const json = await res.json();
          setRawMaterials((json.data?.content ?? []) as RawMaterialItem[]);
        }
      } catch { /* 기준정보 로드 실패 시 수동 입력 가능 */ }
    })();
  }, []);

  // API 조회
  const fetchPlans = useCallback(async (y: number, m: number) => {
    try {
      const res = await authFetch(`/api/production/daily-plans?year=${y}&month=${m}`);
      if (!res.ok) return;
      const json = await res.json();
      const content = json.data?.content ?? [];
      const loaded: PlanRow[] = content.map((item: Record<string, unknown>, idx: number) => {
        const quantities: Record<string, number> = {};
        const qMap = (item.quantities ?? {}) as Record<string, number>;
        for (const [key, val] of Object.entries(qMap)) {
          if (val != null) quantities[key] = val;
        }
        return {
          id: String(item.id ?? `srv-${idx}`),
          customer: (item.customer as string) ?? '',
          lineCode: item.lineCode as string,
          productName: item.productName as string,
          spec: item.spec as string,
          material: item.material as string,
          planType: (item.planType as '계획' | '실적') || '계획',
          quantities,
        };
      });
      setRows(loaded);
    } catch {
      // 조회 실패 시 빈 상태 유지 — 사용자에게는 빈 그리드가 표시됨
      notify('생산계획 조회에 실패했습니다.', { type: 'error' });
    }
  }, [notify]);

  useEffect(() => {
    fetchPlans(year, month);
  }, [year, month, fetchPlans]);

  // 그리드 데이터
  const gridData = useMemo(
    () => buildGridRows(rows, year, month).map((r) => ({ ...r } as Record<string, unknown>)),
    [rows, year, month],
  );

  // 행 종류별 스타일
  const rowKindStyle = useCallback((params: { data?: unknown }, base?: Record<string, unknown>) => {
    const row = params.data as GridRow | undefined;
    if (row?.rowKind === 'subtotal') return { ...base, color: '#6366f1', backgroundColor: '#fffef5', fontWeight: 500 };
    if (row?.rowKind === 'grandTotal') return { ...base, backgroundColor: '#fef9e7', fontWeight: 700 };
    if (row?.rowKind === 'data' && row?.planType === '실적') return { ...base, color: '#16a34a' };
    return base ?? {};
  }, []);

  // 컬럼 정의: 고정 컬럼(ColDef[]) + 일자 컬럼 그룹(ColGroupDef[]) + 월합계(ColDef[])
  const columns = useMemo<(ColDef | ColGroupDef)[]>(() => {
    const fixed: ColDef[] = [
      {
        field: 'customer', headerName: '고객', width: 80, pinned: 'left',
        editable: false,
        cellStyle: (params) => rowKindStyle(params),
        spanRows: (params: { nodeA: { data: GridRow } | null; nodeB: { data: GridRow } | null; valueA: unknown; valueB: unknown }) => {
          const rowA = params.nodeA?.data;
          const rowB = params.nodeB?.data;
          if (rowA?.rowKind !== 'data' || rowB?.rowKind !== 'data') return false;
          return !!params.valueA && params.valueA === params.valueB;
        },
      },
      {
        field: 'lineCode', headerName: 'Line', width: 65, pinned: 'left',
        editable: false,
        cellStyle: (params) => rowKindStyle(params),
        spanRows: (params: { nodeA: { data: GridRow } | null; nodeB: { data: GridRow } | null; valueA: unknown; valueB: unknown }) => {
          const rowA = params.nodeA?.data;
          const rowB = params.nodeB?.data;
          if (rowA?.rowKind !== 'data' || rowB?.rowKind !== 'data') return false;
          return !!params.valueA && params.valueA === params.valueB;
        },
      },
      {
        field: 'productName', headerName: '제품명', width: 80, pinned: 'left',
        editable: false,
        cellStyle: (params) => rowKindStyle(params),
        spanRows: (params: { nodeA: { data: GridRow } | null; nodeB: { data: GridRow } | null; valueA: unknown; valueB: unknown }) => {
          const rowA = params.nodeA?.data;
          const rowB = params.nodeB?.data;
          if (rowA?.rowKind !== 'data' || rowB?.rowKind !== 'data') return false;
          if (rowA?._lineCode !== rowB?._lineCode) return false;
          return !!params.valueA && params.valueA === params.valueB;
        },
      },
      {
        field: 'spec', headerName: '규격', width: 90, pinned: 'left',
        editable: false,
        cellStyle: (params) => rowKindStyle(params),
        spanRows: (params: { nodeA: { data: GridRow } | null; nodeB: { data: GridRow } | null; valueA: unknown; valueB: unknown }) => {
          const rowA = params.nodeA?.data;
          const rowB = params.nodeB?.data;
          if (rowA?.rowKind !== 'data' || rowB?.rowKind !== 'data') return false;
          if (rowA?._lineCode !== rowB?._lineCode || rowA?.productName !== rowB?.productName) return false;
          return !!params.valueA && params.valueA === params.valueB;
        },
      },
      {
        field: 'material', headerName: '재질', width: 80, pinned: 'left',
        editable: false,
        cellStyle: (params) => rowKindStyle(params),
        spanRows: (params: { nodeA: { data: GridRow } | null; nodeB: { data: GridRow } | null; valueA: unknown; valueB: unknown }) => {
          const rowA = params.nodeA?.data;
          const rowB = params.nodeB?.data;
          if (rowA?.rowKind !== 'data' || rowB?.rowKind !== 'data') return false;
          if (rowA?._lineCode !== rowB?._lineCode || rowA?.productName !== rowB?.productName) return false;
          return !!params.valueA && params.valueA === params.valueB;
        },
      },
      {
        field: 'planType', headerName: '실적구분', width: 70, pinned: 'left',
        editable: false,
        cellStyle: (params) => {
          const row = params.data as GridRow;
          if (row?.rowKind === 'subtotal') return { color: '#6366f1', backgroundColor: '#fffef5', fontWeight: 500 };
          if (row?.rowKind === 'grandTotal') return { backgroundColor: '#fef9e7', fontWeight: 700 };
          if (row?.planType === '실적') return { color: '#16a34a' };
          return {};
        },
      },
    ];

    // 3단 헤더 일자 컬럼 그룹
    const dayGroups = buildDayColumnGroups(dayMeta, rowKindStyle);

    // 월별 합계 컬럼
    const months = calcThreeMonths(year, month);
    const monthTotalCols: ColDef[] = months.map((ym, mIdx) => ({
      field: `m${mIdx}_total`,
      headerName: `${ym.month}월계`,
      width: 75,
      editable: false,
      cellDataType: 'number',
      valueGetter: (params) => {
        if (!params.data) return null;
        const days = getDaysInMonth(ym.year, ym.month);
        let sum = 0;
        let hasValue = false;
        for (let d = 1; d <= days; d++) {
          const val = (params.data as GridRow)[`m${mIdx}_d${d}`];
          if (val != null) { sum += val as number; hasValue = true; }
        }
        return hasValue ? Math.round(sum * 10) / 10 : null;
      },
      valueFormatter: (p) => {
        if (p.value == null) return '';
        const num = Number(p.value);
        return Number.isInteger(num) ? num.toLocaleString() : num.toFixed(1);
      },
      cellStyle: (params) => {
        const row = params.data as GridRow;
        if (row?.rowKind === 'subtotal') return { fontWeight: 600, color: '#6366f1', backgroundColor: '#fffef5' };
        if (row?.rowKind === 'grandTotal') return { fontWeight: 700, backgroundColor: '#fef9e7' };
        return { fontWeight: 600, backgroundColor: '#f0fdf4' };
      },
    }));

    const monthTotalGroup: ColGroupDef = {
      headerName: '월계',
      children: monthTotalCols,
    };

    return [...fixed, ...dayGroups, monthTotalGroup];
  }, [dayMeta, year, month, rowKindStyle]);

  // 그리드 → rows state 동기화
  const syncFromGrid = useCallback(() => {
    const displayed = gridRef.current?.getDisplayedData();
    if (!displayed) return [];
    return displayed
      .filter((r) => {
        const gr = r as GridRow;
        return gr.rowKind === 'data' && !gr.id?.startsWith('empty-');
      })
      .map((r) => {
        const gr = r as GridRow;
        const quantities: Record<string, number> = {};
        for (const col of dayMeta) {
          const val = gr[col.field];
          if (val != null && val !== '' && Number(val) !== 0) {
            quantities[col.field] = Number(val);
          }
        }
        return {
          id: gr.id,
          customer: (gr.customer as string) ?? '',
          lineCode: gr._lineCode ?? gr.lineCode ?? '',
          productName: gr.productName ?? '',
          spec: gr.spec ?? '',
          material: gr.material ?? '',
          planType: (gr.planType || '계획') as '계획' | '실적',
          quantities,
        };
      });
  }, [dayMeta]);

  // 붙여넣기 완료 후 동기화
  const handlePasteComplete = useCallback(() => {
    setTimeout(() => {
      const synced = syncFromGrid();
      if (synced.length > 0) setRows(synced);
    }, 50);
  }, [syncFromGrid]);

  // 초기화 (DB 데이터 삭제)
  const handleReset = useCallback(async () => {
    const tm = calcThreeMonths(year, month);
    if (!await confirmDialog(`${year}년 ${tm[0].month}월~${tm[2].month}월 데이터를 모두 삭제하시겠습니까?\n삭제 후 복구할 수 없습니다.`)) return;
    try {
      for (const ym of tm) {
        await authFetch(`/api/production/daily-plans?year=${ym.year}&month=${ym.month}`, { method: 'DELETE' });
      }
      setRows([]);
      notify('데이터가 삭제되었습니다.', { type: 'info' });
    } catch {
      notify('삭제에 실패했습니다.', { type: 'error' });
    }
  }, [year, month, notify]);

  // 행 추가 실행
  const executeAddRows = useCallback((customer: string, lineCode: string, productName: string, spec: string, material: string, count: number) => {
    const synced = syncFromGrid();
    const newRows: PlanRow[] = [];
    for (let i = 0; i < count; i++) {
      newRows.push({
        id: `new-${Date.now()}-${i}-plan`, customer, lineCode, productName, spec, material,
        planType: '계획', quantities: {},
      });
      newRows.push({
        id: `new-${Date.now()}-${i}-actual`, customer, lineCode, productName, spec, material,
        planType: '실적', quantities: {},
      });
    }
    setRows([...synced, ...newRows]);
    setAddRowPopup(false);
  }, [syncFromGrid]);

  // 행 삭제
  const handleDeleteRow = useCallback(async () => {
    const grid = gridRef.current;
    if (!grid) return;
    const selected = grid.getSelectedRows() as GridRow[];
    const dataSelected = selected.filter((r) => r.rowKind === 'data');
    const subtotalSelected = selected.filter((r) => r.rowKind === 'subtotal' && r.id?.startsWith('manual-st-'));

    // 수동 소계 행 삭제: allRows에서 직접 제거
    if (subtotalSelected.length > 0) {
      const allRows = grid.getAllRows();
      const subtotalIds = new Set(subtotalSelected.map((r) => r.id));
      const toRemove: number[] = [];
      for (let i = allRows.length - 1; i >= 0; i--) {
        const row = allRows[i] as GridRow;
        if (subtotalIds.has(row.id)) toRemove.push(i);
      }
      for (const idx of toRemove) allRows.splice(idx, 1);
      grid.refreshView();
    }

    // 데이터 행 삭제
    if (dataSelected.length > 0) {
      const synced = syncFromGrid();
      const pairKeys = new Set<string>();
      for (const r of dataSelected) pairKeys.add(`${r._lineCode}|${r.customer}|${r.productName}|${r.spec}|${r.material}`);
      if (!await confirmDialog(`${pairKeys.size}개 제품(${pairKeys.size * 2}행)을 삭제하시겠습니까?`)) return;
      setRows(synced.filter((r) => !pairKeys.has(`${r.lineCode}|${r.customer}|${r.productName}|${r.spec}|${r.material}`)));
    }

    // 아무것도 선택 안 된 경우: 마지막 데이터 행 삭제
    if (selected.length === 0) {
      const synced = syncFromGrid();
      if (synced.length === 0) return;
      const lastRow = synced[synced.length - 1];
      const lastKey = `${lastRow.lineCode}|${lastRow.customer}|${lastRow.productName}|${lastRow.spec}|${lastRow.material}`;
      setRows(synced.filter((r) => `${r.lineCode}|${r.customer}|${r.productName}|${r.spec}|${r.material}` !== lastKey));
    }
  }, [syncFromGrid]);

  // 엑셀 업로드
  const handleExcelUpload = useCallback(async () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.xlsx,.xls';
    input.onchange = async (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (!file) return;
      try {
        const buffer = await file.arrayBuffer();
        const parsed = parseDailyPlanExcel(buffer);

        if (parsed.warnings.length > 0) {
          notify(parsed.warnings.join('\n'), { type: 'warning' });
        }
        if (parsed.rows.length === 0) return;

        // 파싱된 시작월이 현재 선택된 월과 다르면 자동 반영
        if (parsed.startYear > 0 && parsed.startMonth > 0) {
          if (parsed.startYear !== year || parsed.startMonth !== month) {
            setYear(parsed.startYear);
            setMonth(parsed.startMonth);
          }
        }

        // ParsedDailyPlanRow[] → PlanRow[] 변환
        const newRows: PlanRow[] = parsed.rows.map((r, idx) => ({
          id: `upload-${Date.now()}-${idx}`,
          customer: r.customer,
          lineCode: r.lineCode,
          productName: r.productName,
          spec: r.spec,
          material: r.material,
          planType: r.planType,
          quantities: r.quantities,
        }));

        setRows(newRows);
        notify(`${newRows.length}건이 업로드되었습니다.`, { type: 'success' });
      } catch (err) {
        notify(`엑셀 파싱 실패: ${err instanceof Error ? err.message : '알 수 없는 오류'}`, { type: 'error' });
      }
    };
    input.click();
  }, [notify, year, month]);

  // 저장
  const handleSave = useCallback(async () => {
    const gridRows = syncFromGrid();
    const validRows = gridRows.filter((r) => r.lineCode && r.productName);

    if (validRows.length === 0) {
      notify('저장할 데이터가 없습니다.', { type: 'warning' });
      return;
    }

    // 기존 건수 비교
    try {
      const checkRes = await authFetch(`/api/production/daily-plans?year=${year}&month=${month}`);
      const checkJson = await checkRes.json();
      const dbCount = checkJson.data?.totalElements ?? 0;
      if (dbCount > 0 && validRows.length < dbCount) {
        if (!await confirmDialog(`기존 ${dbCount}건 → ${validRows.length}건으로 줄어듭니다.\n${dbCount - validRows.length}건의 데이터가 삭제됩니다.\n\n정말 저장하시겠습니까?`)) return;
      }
    } catch { /* 건수 조회 실패 시 저장 허용 */ }

    const threeMonths = calcThreeMonths(year, month);
    const payloadRows: { customer: string; lineCode: string; productName: string; spec: string; material: string; planType: string; monthOffset: number; quantities: Record<string, number> }[] = [];

    for (const row of validRows) {
      for (let mIdx = 0; mIdx < 3; mIdx++) {
        const ym = threeMonths[mIdx];
        const days = getDaysInMonth(ym.year, ym.month);
        const monthQuantities: Record<string, number> = {};
        let hasData = false;
        for (let d = 1; d <= days; d++) {
          const val = row.quantities[`m${mIdx}_d${d}`];
          if (val != null) { monthQuantities[`d${d}`] = val; hasData = true; }
        }
        payloadRows.push({
          customer: row.customer, lineCode: row.lineCode, productName: row.productName,
          spec: row.spec, material: row.material, planType: row.planType,
          monthOffset: mIdx, quantities: hasData ? monthQuantities : {},
        });
      }
    }

    try {
      const res = await authFetch('/api/production/daily-plans', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ year, month, rows: payloadRows }),
      });
      const json = await res.json();
      if (json.success) {
        notify(json.message || '저장되었습니다.', { type: 'success' });
        fetchPlans(year, month);
      } else {
        notify(`저장 실패: ${json.error?.message || json.message || '알 수 없는 오류'}`, { type: 'error' });
      }
    } catch (e) {
      notify(`저장 실패: ${e instanceof Error ? e.message : '알 수 없는 오류'}`, { type: 'error' });
    }
  }, [notify, syncFromGrid, year, month, fetchPlans]);

  const selectStyle: React.CSSProperties = {
    height: 28, fontSize: 'var(--font-size-sm)', padding: '0 8px',
    border: '1px solid var(--color-border)', borderRadius: 4, background: '#fff',
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', gap: 8, overflow: 'hidden' }}>
      {/* 조회 조건 */}
      <div className="grid-toolbar">
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <PageTitle />
          <select value={year} onChange={(e) => setYear(Number(e.target.value))} style={selectStyle}>
            {[2024, 2025, 2026, 2027].map((y) => <option key={y} value={y}>{y}년</option>)}
          </select>
          <select value={month} onChange={(e) => setMonth(Number(e.target.value))} style={selectStyle}>
            {Array.from({ length: 12 }, (_, i) => i + 1).map((m) => <option key={m} value={m}>{m}월</option>)}
          </select>
          <span style={{ fontSize: 12, color: '#6b7280' }}>
            ({calcThreeMonths(year, month).map((ym) => `${ym.month}월`).join(' ~ ')})
          </span>
        </div>
        <div style={{ display: 'flex', gap: 6 }}>
          <button onClick={() => setTemplatePopup(true)} className="mes-btn">
            템플릿 다운로드
          </button>
          <button onClick={handleExcelUpload} className="mes-btn">
            엑셀 업로드
          </button>
          <button onClick={handleSave} className="mes-btn mes-btn-save">
            저장
          </button>
        </div>
      </div>

      {/* 그리드 */}
      <div style={{ flex: 1, overflow: 'auto' }}>
        <PeakEditGrid
          ref={gridRef}
          gridId="daily-plan-v2"
          columns={columns}
          data={gridData}
          hideRowNumber
          hideSave
          autoHeight
          excelFileName={`생산계획_${year}년${month}월`}
          pageSize={200}
          toolbarTitle={
            <span style={{ fontSize: 'var(--font-size-base)', fontWeight: 600, color: 'var(--color-text)', marginRight: 4 }}>
              일별 생산계획
            </span>
          }
          hideRowButtons
          onPasteComplete={handlePasteComplete}
          permission={perm}
          extraToolbarButtons={
            <>
              {perm.canUpdate && <button onClick={handleReset} className="mes-btn">초기화</button>}
              {perm.canCreate && <button onClick={() => setAddRowPopup(true)} className="mes-btn">행추가</button>}
              {perm.canDelete && <button onClick={handleDeleteRow} className="mes-btn mes-btn-delete">행삭제</button>}
            </>
          }
        />
      </div>

      {/* 행 추가 팝업 */}
      {addRowPopup && (
        <AddRowPopup
          rawMaterials={rawMaterials}
          onAdd={executeAddRows}
          onClose={() => setAddRowPopup(false)}
        />
      )}

      {/* 템플릿 다운로드 팝업 */}
      {templatePopup && (
        <div
          style={{
            position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
            backgroundColor: 'rgba(0,0,0,0.3)', display: 'flex', alignItems: 'center', justifyContent: 'center',
            zIndex: 9999,
          }}
          onClick={() => setTemplatePopup(false)}
        >
          <div
            style={{
              background: '#fff', borderRadius: 8, padding: '24px 28px', minWidth: 300,
              boxShadow: '0 4px 24px rgba(0,0,0,0.15)',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <h3 style={{ margin: '0 0 16px', fontSize: 15, fontWeight: 600 }}>
              템플릿 다운로드
            </h3>
            <form
              onSubmit={(e) => {
                e.preventDefault();
                const fd = new FormData(e.currentTarget);
                const sm = Number(fd.get('startMonth'));
                downloadDailyPlanTemplate(year, sm);
                setTemplatePopup(false);
              }}
            >
              <div style={{ marginBottom: 14 }}>
                <label style={{ display: 'block', marginBottom: 6, fontSize: 13, fontWeight: 500 }}>
                  연도
                </label>
                <span style={{ fontSize: 14, fontWeight: 600 }}>{year}년</span>
              </div>
              <div style={{ marginBottom: 18 }}>
                <label style={{ display: 'block', marginBottom: 6, fontSize: 13, fontWeight: 500 }}>
                  시작월 (3개월분 생성)
                </label>
                <select name="startMonth" defaultValue={month} style={{
                  width: '100%', height: 32, fontSize: 14, padding: '0 8px',
                  border: '1px solid var(--color-border, #d1d5db)', borderRadius: 4,
                }}>
                  {Array.from({ length: 12 }, (_, i) => i + 1).map((m) => {
                    const months = calcThreeMonths(year, m);
                    return <option key={m} value={m}>{months.map(ym => ym.month + '월').join(', ')}</option>;
                  })}
                </select>
              </div>
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8 }}>
                <button type="button" onClick={() => setTemplatePopup(false)} className="mes-btn" style={{ minWidth: 60 }}>
                  취소
                </button>
                <button type="submit" className="mes-btn mes-btn-save" style={{ minWidth: 60 }}>
                  다운로드
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <style>{`
        .dp-header-sunday .ag-header-cell-label,
        .dp-header-sunday .ag-header-group-cell-label { color: #e11d48 !important; }
        .dp-header-saturday .ag-header-cell-label,
        .dp-header-saturday .ag-header-group-cell-label { color: #2563eb !important; }
        .ag-header-group-center .ag-header-group-cell-label {
          justify-content: center !important;
        }
        .ag-body-viewport .ag-row:last-child .ag-cell {
          border-bottom: 1px solid var(--ag-border-color, #babfc7) !important;
        }
      `}</style>
      <ConfirmDialog />
    </div>
  );
}

/* ── 행추가 팝업 ── */

function AddRowPopup({
  rawMaterials, onAdd, onClose,
}: {
  rawMaterials: RawMaterialItem[];
  onAdd: (customer: string, lineCode: string, productName: string, spec: string, material: string, count: number) => void;
  onClose: () => void;
}) {
  const { notify } = useToast();
  const [customer, setCustomer] = useState('');
  const [lineCode, setLineCode] = useState('P1');
  const [selectedModel, setSelectedModel] = useState('');
  const [productName, setProductName] = useState('');
  const [spec, setSpec] = useState('');
  const [material, setMaterial] = useState('');
  const [count, setCount] = useState(1);

  const handleModelSelect = useCallback((modelName: string) => {
    setSelectedModel(modelName);
    if (!modelName) return;
    const item = rawMaterials.find((r) => r.modelName === modelName);
    if (item) {
      setProductName(item.modelName);
      const raw = item.rawMaterial || '';
      const parts = raw.split(/\s+/);
      if (parts.length >= 2) {
        setSpec(parts[0]);
        setMaterial(parts.slice(1).join(' '));
      } else {
        setSpec(raw);
        setMaterial('');
      }
    }
  }, [rawMaterials]);

  const uniqueModels = useMemo(() => {
    return [...new Set(rawMaterials.map((r) => r.modelName).filter(Boolean))].sort();
  }, [rawMaterials]);

  const inputStyle: React.CSSProperties = {
    width: '100%', height: 32, fontSize: 14, padding: '0 8px',
    border: '1px solid var(--color-border, #d1d5db)', borderRadius: 4, boxSizing: 'border-box',
  };

  return (
    <div
      style={{
        position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
        backgroundColor: 'rgba(0,0,0,0.3)', display: 'flex', alignItems: 'center', justifyContent: 'center',
        zIndex: 9999,
      }}
      onClick={onClose}
    >
      <div
        style={{
          background: '#fff', borderRadius: 8, padding: '24px 28px', minWidth: 380,
          boxShadow: '0 4px 24px rgba(0,0,0,0.15)',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <h3 style={{ margin: '0 0 16px', fontSize: 15, fontWeight: 600 }}>행 추가 — 생산계획</h3>
        <form onSubmit={(e) => {
          e.preventDefault();
          if (!lineCode || !productName) { notify('Line과 제품명은 필수입니다.', { type: 'warning' }); return; }
          onAdd(customer, lineCode, productName, spec, material, Math.max(1, Math.min(10, count)));
        }}>
          <div style={{ marginBottom: 14 }}>
            <label style={{ display: 'block', marginBottom: 6, fontSize: 13, fontWeight: 500 }}>고객</label>
            <input value={customer} onChange={(e) => setCustomer(e.target.value)} style={inputStyle} placeholder="고객명" />
          </div>
          <div style={{ display: 'flex', gap: 12, marginBottom: 14 }}>
            <div style={{ flex: 1 }}>
              <label style={{ display: 'block', marginBottom: 6, fontSize: 13, fontWeight: 500 }}>Line</label>
              <select value={lineCode} onChange={(e) => setLineCode(e.target.value)} style={inputStyle}>
                {['P1', 'Q,R', 'P2', 'O,P', 'P3', 'P4', 'P5', 'E,F', 'P6', 'G,H', 'S1', 'S2'].map((l) => <option key={l} value={l}>{l}</option>)}
              </select>
            </div>
            <div style={{ flex: 1 }}>
              <label style={{ display: 'block', marginBottom: 6, fontSize: 13, fontWeight: 500 }}>추가 수</label>
              <input type="number" min={1} max={10} value={count} onChange={(e) => setCount(Number(e.target.value))} style={inputStyle} />
            </div>
          </div>
          <div style={{ marginBottom: 14 }}>
            <label style={{ display: 'block', marginBottom: 6, fontSize: 13, fontWeight: 500 }}>제품 선택 (원자재 기준정보)</label>
            <select value={selectedModel} onChange={(e) => handleModelSelect(e.target.value)} style={inputStyle}>
              <option value="">직접 입력</option>
              {uniqueModels.map((m) => <option key={m} value={m}>{m}</option>)}
            </select>
          </div>
          <div style={{ display: 'flex', gap: 12, marginBottom: 14 }}>
            <div style={{ flex: 1 }}>
              <label style={{ display: 'block', marginBottom: 6, fontSize: 13, fontWeight: 500 }}>제품명</label>
              <input value={productName} onChange={(e) => setProductName(e.target.value)} style={inputStyle} placeholder="CQ, AQ, 4C 등" />
            </div>
            <div style={{ flex: 1 }}>
              <label style={{ display: 'block', marginBottom: 6, fontSize: 13, fontWeight: 500 }}>규격</label>
              <input value={spec} onChange={(e) => setSpec(e.target.value)} style={inputStyle} placeholder="0.2*45" />
            </div>
          </div>
          <div style={{ marginBottom: 18 }}>
            <label style={{ display: 'block', marginBottom: 6, fontSize: 13, fontWeight: 500 }}>재질</label>
            <input value={material} onChange={(e) => setMaterial(e.target.value)} style={inputStyle} placeholder="무산소, 일반동, H0 등" />
          </div>
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8 }}>
            <button type="button" onClick={onClose} className="mes-btn" style={{ minWidth: 60 }}>취소</button>
            <button type="submit" className="mes-btn mes-btn-save" style={{ minWidth: 60 }}>추가</button>
          </div>
        </form>
      </div>
    </div>
  );
}
