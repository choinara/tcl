import { useState, useMemo, useCallback, useRef, useEffect } from 'react';
import { usePermission } from '@/hooks/usePermission';
import { PageTitle } from '@/components/ui/PageTitle';
import { PeakEditGrid } from '@/components/grid';
import type { PeakEditGridRef } from '@/components/grid';
import type { ColDef } from 'ag-grid-community';
import { useToast } from '@/shared/components/toast/ToastProvider';
import { useConfirm } from '@/components/ui/ConfirmDialog';
import { authFetch } from '@/lib/api';
import { parseOrderExcel } from '../utils/parseOrderExcel';
import type { ParsedOrderRow, MonthData } from '../utils/parseOrderExcel';
import { downloadOrderTemplate } from '../utils/generateOrderTemplate';

/* ── Types ── */

type OrderStatus = '접수' | '확정' | '변경' | '취소';
type Polarity = '음극' | '양극';

interface OrderRow {
  id: string;
  polarity: Polarity;
  site: string;
  spec: string;
  material: string;
  category: string;
  status: OrderStatus;
  quantities: Record<number, number>;
}

type RowKind = 'data' | 'subtotal' | 'grandTotal';

interface GridRow {
  id: string;
  rowKind: RowKind;
  __isTotal?: boolean;
  _polarityCode?: Polarity;
  _siteCode?: string;
  polarity: string;
  site: string;
  spec: string;
  material: string;
  category: string;
  status: string;
  [key: `d${number}`]: number | null;
  monthTotal?: number;
}

/* ── Constants ── */

const STATUS_OPTIONS: OrderStatus[] = ['접수', '확정', '변경', '취소'];
const DAY_NAMES = ['일', '월', '화', '수', '목', '금', '토'];
const POLARITY_LABELS: Record<Polarity, string> = { '음극': '음극 Cu(-)', '양극': '양극 Al(+)' };
const SITE_LABELS: Record<string, string> = { MP: '성남MP', SLD: '파주SLD' };

/* ── Date helpers ── */

function getDaysInMonth(year: number, month: number): number {
  return new Date(year, month, 0).getDate();
}

function getDayOfWeek(year: number, month: number, day: number): number {
  return new Date(year, month - 1, day).getDay();
}

/* ── Build section grid rows ── */

function buildGridRows(allRows: OrderRow[], polarity: Polarity, year: number, month: number): GridRow[] {
  const days = getDaysInMonth(year, month);
  const poleRows = allRows.filter((r) => r.polarity === polarity);
  const siteOrder = ['MP', 'SLD'];

  const grouped = new Map<string, OrderRow[]>();
  for (const site of siteOrder) {
    const siteRows = poleRows.filter((r) => r.site === site);
    if (siteRows.length > 0) grouped.set(site, siteRows);
  }
  // site가 빈 문자열이거나 siteOrder에 없는 행 (신규 추가 행)
  const ungrouped = poleRows.filter((r) => !siteOrder.includes(r.site));

  const result: GridRow[] = [];
  const grandTotals: Record<string, number> = {};

  for (const [site, siteRows] of grouped) {
    const subtotals: Record<string, number> = {};

    for (const row of siteRows) {
      const gridRow: GridRow = {
        id: row.id,
        rowKind: 'data',
        _polarityCode: polarity,
        _siteCode: site,
        polarity: POLARITY_LABELS[polarity],
        site: SITE_LABELS[site] || site,
        spec: row.spec,
        material: row.material,
        category: row.category,
        status: row.status,
      };

      let monthSum = 0;
      for (let d = 1; d <= days; d++) {
        const val = row.quantities[d] ?? null;
        gridRow[`d${d}`] = val;
        if (val != null) {
          monthSum += val;
          subtotals[`d${d}`] = (subtotals[`d${d}`] ?? 0) + val;
          grandTotals[`d${d}`] = (grandTotals[`d${d}`] ?? 0) + val;
        }
      }
      gridRow.monthTotal = monthSum > 0 ? monthSum : undefined;
      result.push(gridRow);
    }

    // 소계
    const subtotalRow: GridRow = {
      id: `st-${polarity}-${site}`,
      rowKind: 'subtotal',
      polarity: '',
      site: '',
      spec: '', material: '', category: `${SITE_LABELS[site] || site} 소계`, status: '',
    };
    let stTotal = 0;
    for (let d = 1; d <= days; d++) {
      const val = subtotals[`d${d}`] ?? null;
      subtotalRow[`d${d}`] = val;
      if (val != null) stTotal += val;
    }
    subtotalRow.monthTotal = stTotal > 0 ? stTotal : undefined;
    result.push(subtotalRow);
  }

  // 미분류 행 (빈 site) — 소계 없이 합계 앞에 배치
  for (const row of ungrouped) {
    const gridRow: GridRow = {
      id: row.id,
      rowKind: 'data',
      _polarityCode: polarity,
      _siteCode: row.site,
      polarity: POLARITY_LABELS[polarity],
      site: row.site,
      spec: row.spec,
      material: row.material,
      category: row.category,
      status: row.status,
    };
    let monthSum = 0;
    for (let d = 1; d <= days; d++) {
      const val = row.quantities[d] ?? null;
      gridRow[`d${d}`] = val;
      if (val != null) {
        monthSum += val;
        grandTotals[`d${d}`] = (grandTotals[`d${d}`] ?? 0) + val;
      }
    }
    gridRow.monthTotal = monthSum > 0 ? monthSum : undefined;
    result.push(gridRow);
  }

  // 데이터 행이 하나도 없으면 공란 1행 추가
  if (result.length === 0) {
    const emptyRow: GridRow = {
      id: `empty-${polarity}`,
      rowKind: 'data',
      _polarityCode: polarity,
      _siteCode: '',
      polarity: '',
      site: '',
      spec: '', material: '', category: '', status: '',
    };
    for (let d = 1; d <= days; d++) emptyRow[`d${d}`] = null;
    result.push(emptyRow);
  }

  // 합계
  const grandTotalRow: GridRow = {
    id: `gt-${polarity}`,
    rowKind: 'grandTotal',
    __isTotal: true,
    polarity: '',
    site: '',
    spec: '', material: '', category: `${polarity} 합계`, status: '',
  };
  let gtTotal = 0;
  for (let d = 1; d <= days; d++) {
    const val = grandTotals[`d${d}`] ?? null;
    grandTotalRow[`d${d}`] = val;
    if (val != null) gtTotal += val;
  }
  grandTotalRow.monthTotal = gtTotal > 0 ? gtTotal : undefined;
  result.push(grandTotalRow);

  return result;
}

/* ── Component ── */

export default function OrderRegistrationPage() {
  const perm = usePermission('PM0020');
  const { notify } = useToast();
  const { confirm: confirmDialog, ConfirmDialog } = useConfirm();
  const cathodeGridRef = useRef<PeakEditGridRef>(null);
  const anodeGridRef = useRef<PeakEditGridRef>(null);

  const [year, setYear] = useState(() => new Date().getFullYear());
  const [month, setMonth] = useState(() => new Date().getMonth() + 1);
  const [rows, setRows] = useState<OrderRow[]>([]);
  const [filterPole, setFilterPole] = useState<'전체' | Polarity>('전체');
  const [filterStatus, setFilterStatus] = useState<'전체' | OrderStatus>('전체');
  const [addRowPopup, setAddRowPopup] = useState<{ polarity: Polarity; gridRef: React.RefObject<PeakEditGridRef | null> } | null>(null);
  const [templatePopup, setTemplatePopup] = useState(false);

  const daysInMonth = getDaysInMonth(year, month);

  // API 조회
  const fetchOrders = useCallback(async (y: number, m: number) => {
    try {
      const res = await authFetch(`/api/production/orders?year=${y}&month=${m}`);
      if (!res.ok) return;
      const json = await res.json();
      const content = json.data?.content ?? [];
      const loaded: OrderRow[] = content.map((item: Record<string, unknown>, idx: number) => {
        const quantities: Record<number, number> = {};
        const qMap = (item.quantities ?? {}) as Record<string, number>;
        for (const [key, val] of Object.entries(qMap)) {
          const day = Number(key.replace('d', ''));
          if (!isNaN(day) && val != null) quantities[day] = val;
        }
        return {
          id: String(item.id ?? `srv-${idx}`),
          polarity: item.polarity as Polarity,
          site: item.site as string,
          spec: item.spec as string,
          material: item.material as string,
          category: (item.category as string) || 'Demand',
          status: (item.status as OrderStatus) || '접수',
          quantities,
        };
      });
      setRows(loaded);
    } catch {
      // 조회 실패 시 빈 상태 유지 — 사용자에게는 빈 그리드가 표시됨
      notify('수주 데이터 조회에 실패했습니다.', { type: 'error' });
    }
  }, [notify]);

  useEffect(() => {
    fetchOrders(year, month);
  }, [year, month, fetchOrders]);

  // 필터 적용
  const filteredRows = useMemo(() => {
    let result = rows;
    if (filterPole !== '전체') result = result.filter((r) => r.polarity === filterPole);
    if (filterStatus !== '전체') result = result.filter((r) => r.status === filterStatus);
    return result;
  }, [rows, filterPole, filterStatus]);

  // 그리드 데이터 (음극/양극)
  const cathodeGridData = useMemo(
    () => buildGridRows(filteredRows, '음극', year, month).map(r => ({ ...r } as Record<string, unknown>)),
    [filteredRows, year, month],
  );
  const anodeGridData = useMemo(
    () => buildGridRows(filteredRows, '양극', year, month).map(r => ({ ...r } as Record<string, unknown>)),
    [filteredRows, year, month],
  );

  // 행 종류별 공통 스타일
  const rowKindStyle = useCallback((params: { data?: unknown }, base?: Record<string, unknown>) => {
    const row = params.data as GridRow | undefined;
    if (row?.rowKind === 'subtotal') return { ...base, color: '#6366f1', backgroundColor: '#fffef5', fontWeight: 500 };
    if (row?.rowKind === 'grandTotal') return { ...base, backgroundColor: '#fef9e7', fontWeight: 700 };
    return base ?? {};
  }, []);

  // 컬럼 정의
  const columns = useMemo<ColDef[]>(() => {
    const fixed: ColDef[] = [
      {
        field: 'site', headerName: '거점', width: 80, pinned: 'left',
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
        field: 'status', headerName: '수주상태', width: 90, pinned: 'left',
        editable: (params) => (params.data as GridRow)?.rowKind === 'data',
        cellEditor: 'agSelectCellEditor',
        cellEditorParams: { values: STATUS_OPTIONS },
        cellStyle: (params) => {
          const row = params.data as GridRow;
          if (row?.rowKind === 'subtotal') return { color: '#6366f1', backgroundColor: '#fffef5', fontWeight: 500 };
          if (row?.rowKind === 'grandTotal') return { backgroundColor: '#fef9e7', fontWeight: 700 };
          const status = params.value as OrderStatus;
          const colors: Record<OrderStatus, string> = {
            '접수': '#3b82f6', '확정': '#16a34a', '변경': '#f59e0b', '취소': '#ef4444',
          };
          return status && colors[status] ? { color: colors[status], fontWeight: 600 } : {};
        },
      },
      { field: 'spec', headerName: '규격', width: 100, pinned: 'left', editable: (params) => (params.data as GridRow)?.rowKind === 'data', cellStyle: (params) => rowKindStyle(params) },
      { field: 'material', headerName: '재질', width: 80, pinned: 'left', editable: (params) => (params.data as GridRow)?.rowKind === 'data', cellStyle: (params) => rowKindStyle(params) },
      { field: 'category', headerName: '구분', width: 120, pinned: 'left', editable: (params) => (params.data as GridRow)?.rowKind === 'data', cellStyle: (params) => rowKindStyle(params) },
    ];

    const dayCols: ColDef[] = [];
    for (let d = 1; d <= daysInMonth; d++) {
      const dow = getDayOfWeek(year, month, d);
      const dayLabel = DAY_NAMES[dow];
      const isWeekend = dow === 0 || dow === 6;
      const isSaturday = dow === 6;
      dayCols.push({
        field: `d${d}`,
        headerName: `${month}/${d}`,
        headerTooltip: `${month}/${d} (${dayLabel})`,
        width: 70,
        cellDataType: 'number',
        editable: (params) => (params.data as GridRow)?.rowKind === 'data',
        headerClass: isWeekend ? (isSaturday ? 'order-header-saturday' : 'order-header-sunday') : '',
        cellStyle: (params) => {
          const base = isWeekend ? { backgroundColor: '#f1f5f9' } : {};
          return rowKindStyle(params, base);
        },
        valueFormatter: (p) => (p.value != null ? Number(p.value).toLocaleString() : ''),
        valueParser: (p) => {
          if (p.newValue === '' || p.newValue == null) return null;
          const num = Number(p.newValue);
          return isNaN(num) ? null : num;
        },
      });
    }

    const totalCol: ColDef = {
      field: 'monthTotal',
      headerName: '월합계',
      width: 90,
      editable: false,
      cellDataType: 'number',
      valueGetter: (params) => {
        if (!params.data) return null;
        let sum = 0;
        let hasValue = false;
        for (let d = 1; d <= daysInMonth; d++) {
          const val = (params.data as GridRow)[`d${d}`];
          if (val != null) { sum += val as number; hasValue = true; }
        }
        return hasValue ? sum : null;
      },
      valueFormatter: (p) => (p.value != null ? Number(p.value).toLocaleString() : ''),
      cellStyle: (params) => {
        const row = params.data as GridRow;
        if (row?.rowKind === 'subtotal') return { fontWeight: 600, color: '#6366f1', backgroundColor: '#fffef5' };
        if (row?.rowKind === 'grandTotal') return { fontWeight: 700, backgroundColor: '#fef9e7' };
        return { fontWeight: 600, backgroundColor: '#f0fdf4' };
      },
    };

    return [...fixed, ...dayCols, totalCol];
  }, [daysInMonth, year, month, rowKindStyle]);

  // 그리드 내부 데이터를 rows state로 동기화 (paste 데이터 보존)
  const syncFromGrid = useCallback(() => {
    const readGrid = (ref: React.RefObject<PeakEditGridRef | null>): OrderRow[] => {
      const displayed = ref.current?.getDisplayedData();
      if (!displayed) return [];
      return displayed
        .filter((r) => {
          const gr = r as GridRow;
          return gr.rowKind === 'data' && !gr.id?.startsWith('empty-');
        })
        .map((r) => {
          const gr = r as GridRow;
          const quantities: Record<number, number> = {};
          for (let d = 1; d <= 31; d++) {
            const val = gr[`d${d}`];
            if (val != null && val !== '' && Number(val) !== 0) {
              quantities[d] = Number(val);
            }
          }
          return {
            id: gr.id,
            polarity: (gr._polarityCode || '음극') as Polarity,
            site: gr._siteCode ?? gr.site ?? '',
            spec: gr.spec ?? '',
            material: gr.material ?? '',
            category: gr.category ?? '',
            status: (gr.status || '') as OrderStatus,
            quantities,
          };
        });
    };
    const cathode = readGrid(cathodeGridRef);
    const anode = readGrid(anodeGridRef);
    return [...cathode, ...anode];
  }, []);

  // 붙여넣기 완료 후 소계/합계 재계산
  const handlePasteComplete = useCallback(() => {
    // 약간의 딜레이로 PeakEditGrid 내부 상태 반영 대기
    setTimeout(() => {
      const synced = syncFromGrid();
      if (synced.length > 0) {
        setRows(synced);
      }
    }, 50);
  }, [syncFromGrid]);

  // 초기화 (극성별 DB 데이터 삭제 + 해당 그리드만 비우기)
  const handleReset = useCallback(async (polarity: Polarity) => {
    const label = polarity === '음극' ? '음극 Cu(-)' : '양극 Al(+)';
    if (!await confirmDialog(`${year}년 ${month}월 ${label} 데이터를 모두 삭제하시겠습니까?\n삭제 후 복구할 수 없습니다.`)) return;
    try {
      const res = await authFetch(
        `/api/production/orders?year=${year}&month=${month}&polarity=${encodeURIComponent(polarity)}`,
        { method: 'DELETE' },
      );
      const json = await res.json();
      if (json.success) {
        setRows((prev) => prev.filter((r) => r.polarity !== polarity));
        notify(json.message || `${label} 데이터가 삭제되었습니다.`, { type: 'info' });
      } else {
        notify(json.error?.message || '삭제에 실패했습니다.', { type: 'error' });
      }
    } catch {
      notify('삭제에 실패했습니다.', { type: 'error' });
    }
  }, [year, month, notify]);

  // 행 추가 팝업 열기
  const handleAddRowClick = useCallback((polarity: Polarity, gridRef: React.RefObject<PeakEditGridRef | null>) => {
    setAddRowPopup({ polarity, gridRef });
  }, []);

  // 행 추가 실행
  const executeAddRows = useCallback((count: number, position: 'below' | 'end') => {
    if (!addRowPopup) return;
    const { polarity, gridRef } = addRowPopup;
    const synced = syncFromGrid();

    const newRows: OrderRow[] = [];
    for (let i = 0; i < count; i++) {
      newRows.push({
        id: `new-${Date.now()}-${i}`,
        polarity,
        site: '',
        spec: '',
        material: '',
        category: '',
        status: '' as OrderStatus,
        quantities: {},
      });
    }

    if (position === 'below') {
      // 선택한 셀의 하단에 삽입
      const grid = gridRef.current;
      const focused = grid?.getFocusedCell();
      if (focused) {
        const allRows = grid?.getAllRows();
        if (allRows) {
          const focusedRow = allRows[focused.rowIndex] as GridRow | undefined;
          if (focusedRow && focusedRow.rowKind === 'data') {
            const focusedId = focusedRow.id;
            const idx = synced.findIndex((r) => r.id === focusedId);
            if (idx >= 0) {
              const result = [...synced];
              result.splice(idx + 1, 0, ...newRows);
              setRows(result);
              setAddRowPopup(null);
              return;
            }
          }
        }
      }
      // 포커스 없으면 마지막에 추가
    }

    // 마지막 하단에 추가
    setRows([...synced, ...newRows]);
    setAddRowPopup(null);
  }, [addRowPopup, syncFromGrid]);

  // 행 삭제 (선택된 행), 기존 paste 데이터 보존
  const handleDeleteRow = useCallback(async (polarity: Polarity, gridRef: React.RefObject<PeakEditGridRef | null>) => {
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

    // 데이터 행 삭제: rows state에서 제거
    if (dataSelected.length > 0) {
      const synced = syncFromGrid();
      const selectedIds = new Set(dataSelected.map((r) => r.id));
      if (!await confirmDialog(`${selectedIds.size}건의 행을 삭제하시겠습니까?`)) return;
      setRows(synced.filter((r) => !selectedIds.has(r.id)));
    }

    // 아무것도 선택 안 된 경우: 마지막 데이터 행 삭제
    if (selected.length === 0) {
      const synced = syncFromGrid();
      const displayed = grid.getDisplayedData() as GridRow[];
      const dataIds = displayed.filter((r) => r.rowKind === 'data').map((r) => r.id);
      if (dataIds.length === 0) return;
      const lastId = dataIds[dataIds.length - 1];
      setRows(synced.filter((r) => r.id !== lastId));
    }
  }, [syncFromGrid]);

  // 셀 편집 → 원본 데이터 반영
  const handleCellValueChanged = useCallback((field: string, rowId: string, newValue: unknown) => {
    if (field === 'status') {
      setRows((prev) => prev.map((r) => r.id === rowId ? { ...r, status: newValue as OrderStatus } : r));
      return;
    }
    if (!field.startsWith('d')) return;
    const day = Number(field.slice(1));
    setRows((prev) =>
      prev.map((r) => {
        if (r.id !== rowId) return r;
        const nextQty = { ...r.quantities };
        if (newValue == null) delete nextQty[day]; else nextQty[day] = newValue as number;
        return { ...r, quantities: nextQty };
      }),
    );
  }, []);

  // 월별 데이터 → API 저장 (백그라운드)
  const saveMonthData = useCallback(async (targetYear: number, targetMonth: number, monthRows: ParsedOrderRow[]) => {
    const payload = {
      year: targetYear,
      month: targetMonth,
      rows: monthRows.map((pr) => ({
        id: null,
        polarity: pr.polarity,
        site: pr.site,
        spec: pr.spec,
        material: pr.material,
        category: pr.category,
        status: '접수',
        quantities: Object.fromEntries(
          Object.entries(pr.quantities).map(([day, val]) => [`d${day}`, val]),
        ),
      })),
    };
    const res = await authFetch('/api/production/orders', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    return res.json();
  }, []);

  // 엑셀 업로드 (XLSX → 파싱, 멀티 월 지원)
  const handleExcelUpload = useCallback(async () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.xlsx,.xls,.csv';
    input.onchange = async (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (!file) return;
      try {
        const buffer = await file.arrayBuffer();
        const result = parseOrderExcel(buffer);

        // 경고 표시
        if (result.warnings.length > 0) {
          notify(result.warnings.join('\n'), { type: 'warning', persistent: true });
        }

        if (result.rows.length === 0) {
          notify('파싱된 데이터가 없습니다. 양식을 확인하세요.', { type: 'error' });
          return;
        }

        const months = result.byMonth;

        // 멀티 월 처리: 다른 월 데이터는 바로 API 저장
        if (months.length > 1) {
          const otherMonths = months.filter((m: MonthData) => m.month !== month);
          const currentMonthData = months.find((m: MonthData) => m.month === month)
            || months[0]; // 현재 월 데이터가 없으면 첫 번째 월 표시

          // 다른 월은 백그라운드 저장
          let savedCount = 0;
          for (const md of otherMonths) {
            try {
              const json = await saveMonthData(year, md.month, md.rows);
              if (json.success) savedCount += md.rows.length;
            } catch { /* 다른 월 백그라운드 저장 실패 — 현재 월 저장에 영향 없음 */ }
          }
          if (savedCount > 0) {
            notify(`${otherMonths.map((m: MonthData) => m.month + '월').join(', ')} 데이터 ${savedCount}건 자동 저장`, { type: 'info' });
          }

          // 현재 월 또는 첫 번째 월 데이터를 화면에 표시
          if (!months.find((m: MonthData) => m.month === month)) {
            setMonth(currentMonthData.month);
          }

          // 현재 월 데이터만 화면에 적용
          applyParsedRows(currentMonthData.rows, result.totalMismatches, file.name);
        } else {
          // 단일 월
          if (result.month > 0 && result.month !== month) {
            notify(`엑셀 파일의 월(${result.month}월)이 현재 선택된 월(${month}월)과 다릅니다. ${result.month}월로 변경합니다.`, { type: 'warning' });
            setMonth(result.month);
          }
          applyParsedRows(result.rows, result.totalMismatches, file.name);
        }
      } catch (err) {
        notify('엑셀 파일 파싱에 실패했습니다.', { type: 'error' });
      }
    };
    input.click();
  }, [notify, month, year, saveMonthData]);

  // 파싱 결과 → 화면 적용
  const applyParsedRows = useCallback((parsedRows: ParsedOrderRow[], _mismatches: unknown, fileName: string) => {
    let idCounter = 1;
    const newRows: OrderRow[] = parsedRows.map((pr: ParsedOrderRow) => ({
      id: `upload-${idCounter++}`,
      polarity: pr.polarity as Polarity,
      site: pr.site,
      spec: pr.spec,
      material: pr.material,
      category: pr.category,
      status: '접수' as OrderStatus,
      quantities: pr.quantities,
    }));
    setRows(newRows);
    notify(`${fileName} 업로드 완료 — ${parsedRows.length}건 적용`, { type: 'success' });
  }, [notify]);

  // 저장 (그리드 내부 데이터 동기화 후 저장)
  const handleSave = useCallback(async () => {
    // ① 필터 상태에서 저장 차단
    if (filterPole !== '전체' || filterStatus !== '전체') {
      notify('필터를 해제한 후 저장해 주세요. (극성: 전체, 상태: 전체)', { type: 'warning' });
      return;
    }

    const gridRows = syncFromGrid();
    // 필수 필드(규격) 없는 빈 행 제외
    const validRows = gridRows.filter((r) => r.spec && r.spec.trim() !== '');

    // ② 0건 저장 차단
    if (validRows.length === 0) {
      notify('저장할 데이터가 없습니다.', { type: 'warning' });
      return;
    }

    // ③ DB 기존 건수 조회 후 비교
    try {
      const checkRes = await authFetch(`/api/production/orders?year=${year}&month=${month}`);
      const checkJson = await checkRes.json();
      const dbCount = checkJson.data?.totalElements ?? 0;

      if (dbCount > 0 && validRows.length < dbCount) {
        const confirmed = await confirmDialog(
          `기존 ${dbCount}건 → ${validRows.length}건으로 줄어듭니다.\n`
          + `${dbCount - validRows.length}건의 데이터가 삭제됩니다.\n\n정말 저장하시겠습니까?`,
        );
        if (!confirmed) return;
      }
    } catch {
      // 건수 조회 실패 시 저장 자체는 허용
    }

    // ④ 저장 실행
    try {
      const payload = {
        year,
        month,
        rows: validRows.map((r) => ({
          polarity: r.polarity || '음극',
          site: r.site || '',
          spec: r.spec,
          material: r.material || '',
          category: r.category || '',
          status: r.status || '',
          quantities: Object.fromEntries(
            Object.entries(r.quantities).map(([day, val]) => [`d${day}`, val]),
          ),
        })),
      };
      console.log('[OrderSave] payload:', JSON.stringify(payload, null, 2));
      const res = await authFetch('/api/production/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const json = await res.json();
      console.log('[OrderSave] response:', json);
      if (json.success) {
        notify(json.message || '저장되었습니다.', { type: 'success' });
        fetchOrders(year, month);
      } else {
        const errMsg = json.error?.message || json.message || JSON.stringify(json);
        notify(`저장 실패: ${errMsg}`, { type: 'error' });
      }
    } catch (e) {
      console.error('[OrderSave] error:', e);
      notify(`저장 실패: ${e instanceof Error ? e.message : '알 수 없는 오류'}`, { type: 'error' });
    }
  }, [notify, syncFromGrid, filterPole, filterStatus, year, month, fetchOrders]);

  const showCathode = filterPole === '전체' || filterPole === '음극';
  const showAnode = filterPole === '전체' || filterPole === '양극';

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
          <select value={filterPole} onChange={(e) => setFilterPole(e.target.value as typeof filterPole)} style={selectStyle}>
            <option value="전체">극성: 전체</option>
            <option value="음극">음극</option>
            <option value="양극">양극</option>
          </select>
          <select value={filterStatus} onChange={(e) => setFilterStatus(e.target.value as typeof filterStatus)} style={selectStyle}>
            <option value="전체">상태: 전체</option>
            {STATUS_OPTIONS.map((s) => <option key={s} value={s}>{s}</option>)}
          </select>
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

      {/* 그리드 영역 */}
      <div style={{ flex: 1, overflow: 'auto' }}>
        {showCathode && (
          <div style={{ marginBottom: 16 }}>
            <PeakEditGrid
              ref={cathodeGridRef}
              gridId="order-cathode"
              columns={columns}
              data={cathodeGridData}
              hideRowNumber
              hideSave
              autoHeight
              excelFileName={`수주현황_${year}년${month}월`}
              pageSize={100}
              toolbarTitle={
                <span style={{ fontSize: 'var(--font-size-base)', fontWeight: 600, color: 'var(--color-text)', marginRight: 4 }}>
                  수주 현황 - 음극 Cu(-)
                </span>
              }
              hideRowButtons
              onPasteComplete={handlePasteComplete}
              permission={perm}
              extraToolbarButtons={
                <>
                  {perm.canUpdate && <button onClick={() => handleReset('음극')} className="mes-btn">초기화</button>}
                  {perm.canCreate && <button onClick={() => handleAddRowClick('음극', cathodeGridRef)} className="mes-btn">행추가</button>}
                  {perm.canDelete && <button onClick={() => handleDeleteRow('음극', cathodeGridRef)} className="mes-btn mes-btn-delete">행삭제</button>}
                </>
              }
            />
          </div>
        )}

        {showAnode && (
          <div>
            <PeakEditGrid
              ref={anodeGridRef}
              gridId="order-anode"
              columns={columns}
              data={anodeGridData}
              hideRowNumber
              hideSave
              autoHeight
              excelFileName={`수주현황_${year}년${month}월`}
              pageSize={100}
              toolbarTitle={
                <span style={{ fontSize: 'var(--font-size-base)', fontWeight: 600, color: 'var(--color-text)', marginRight: 4 }}>
                  수주 현황 - 양극 Al(+)
                </span>
              }
              hideRowButtons
              onPasteComplete={handlePasteComplete}
              permission={perm}
              extraToolbarButtons={
                <>
                  {perm.canUpdate && <button onClick={() => handleReset('양극')} className="mes-btn">초기화</button>}
                  {perm.canCreate && <button onClick={() => handleAddRowClick('양극', anodeGridRef)} className="mes-btn">행추가</button>}
                  {perm.canDelete && <button onClick={() => handleDeleteRow('양극', anodeGridRef)} className="mes-btn mes-btn-delete">행삭제</button>}
                </>
              }
            />
          </div>
        )}
      </div>

      {/* 행 추가 팝업 */}
      {addRowPopup && (
        <div
          style={{
            position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
            backgroundColor: 'rgba(0,0,0,0.3)', display: 'flex', alignItems: 'center', justifyContent: 'center',
            zIndex: 9999,
          }}
          onClick={() => setAddRowPopup(null)}
        >
          <div
            style={{
              background: '#fff', borderRadius: 8, padding: '24px 28px', minWidth: 320,
              boxShadow: '0 4px 24px rgba(0,0,0,0.15)',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <h3 style={{ margin: '0 0 16px', fontSize: 15, fontWeight: 600 }}>
              행 추가 — {addRowPopup.polarity === '음극' ? '음극 Cu(-)' : '양극 Al(+)'}
            </h3>
            <form
              onSubmit={(e) => {
                e.preventDefault();
                const formData = new FormData(e.currentTarget);
                const count = Math.max(1, Math.min(25, Number(formData.get('rowCount')) || 1));
                const position = (formData.get('position') as 'below' | 'end') || 'end';
                executeAddRows(count, position);
              }}
            >
              <div style={{ marginBottom: 14 }}>
                <label style={{ display: 'block', marginBottom: 6, fontSize: 13, fontWeight: 500 }}>
                  추가할 행 수 (최대 25행)
                </label>
                <input
                  name="rowCount"
                  type="number"
                  min={1}
                  max={25}
                  defaultValue={1}
                  autoFocus
                  style={{
                    width: '100%', height: 32, fontSize: 14, padding: '0 8px',
                    border: '1px solid var(--color-border, #d1d5db)', borderRadius: 4,
                    boxSizing: 'border-box',
                  }}
                />
              </div>
              <div style={{ marginBottom: 18 }}>
                <label style={{ display: 'block', marginBottom: 6, fontSize: 13, fontWeight: 500 }}>
                  추가 위치
                </label>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                  <label style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 13, cursor: 'pointer' }}>
                    <input type="radio" name="position" value="below" defaultChecked />
                    선택한 셀 하단
                  </label>
                  <label style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 13, cursor: 'pointer' }}>
                    <input type="radio" name="position" value="end" />
                    리스트 마지막 (합계 행 위)
                  </label>
                </div>
              </div>
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8 }}>
                <button type="button" onClick={() => setAddRowPopup(null)} className="mes-btn" style={{ minWidth: 60 }}>
                  취소
                </button>
                <button type="submit" className="mes-btn mes-btn-save" style={{ minWidth: 60 }}>
                  추가
                </button>
              </div>
            </form>
          </div>
        </div>
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
                const em = Number(fd.get('endMonth'));
                if (em < sm) {
                  notify('종료월은 시작월 이후여야 합니다.', { type: 'warning' });
                  return;
                }
                downloadOrderTemplate(year, sm, em);
                setTemplatePopup(false);
              }}
            >
              <div style={{ marginBottom: 14 }}>
                <label style={{ display: 'block', marginBottom: 6, fontSize: 13, fontWeight: 500 }}>
                  연도
                </label>
                <span style={{ fontSize: 14, fontWeight: 600 }}>{year}년</span>
              </div>
              <div style={{ display: 'flex', gap: 12, marginBottom: 18 }}>
                <div style={{ flex: 1 }}>
                  <label style={{ display: 'block', marginBottom: 6, fontSize: 13, fontWeight: 500 }}>
                    시작월
                  </label>
                  <select name="startMonth" defaultValue={month} style={{
                    width: '100%', height: 32, fontSize: 14, padding: '0 8px',
                    border: '1px solid var(--color-border, #d1d5db)', borderRadius: 4,
                  }}>
                    {Array.from({ length: 12 }, (_, i) => i + 1).map((m) => (
                      <option key={m} value={m}>{m}월</option>
                    ))}
                  </select>
                </div>
                <div style={{ flex: 1 }}>
                  <label style={{ display: 'block', marginBottom: 6, fontSize: 13, fontWeight: 500 }}>
                    종료월
                  </label>
                  <select name="endMonth" defaultValue={Math.min(month + 2, 12)} style={{
                    width: '100%', height: 32, fontSize: 14, padding: '0 8px',
                    border: '1px solid var(--color-border, #d1d5db)', borderRadius: 4,
                  }}>
                    {Array.from({ length: 12 }, (_, i) => i + 1).map((m) => (
                      <option key={m} value={m}>{m}월</option>
                    ))}
                  </select>
                </div>
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
        .order-header-sunday .ag-header-cell-label { color: #e11d48 !important; }
        .order-header-saturday .ag-header-cell-label { color: #2563eb !important; }
        /* autoHeight 모드에서 마지막 행 하단 테두리 표시 */
        .ag-body-viewport .ag-row:last-child .ag-cell {
          border-bottom: 1px solid var(--ag-border-color, #babfc7) !important;
        }
      `}</style>
      <ConfirmDialog />
    </div>
  );
}
