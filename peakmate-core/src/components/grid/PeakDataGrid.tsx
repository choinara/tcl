import { useState, useRef, useEffect, useMemo, useCallback } from 'react';
import { AgGridReact } from 'ag-grid-react';
import type { ColDef, ColTypeDef, RowDragEndEvent, ColumnResizedEvent, RowClassParams, CellClickedEvent, CellKeyDownEvent } from 'ag-grid-community';
import { AllCommunityModule, ModuleRegistry } from 'ag-grid-community';
import { useTranslation } from 'react-i18next';
import { authFetch } from '@/lib/api';
import type { PagedResponse, ApiResponse } from '@/components/grid/types';
import { usePreferenceStore } from '@/stores/usePreferenceStore';
import { useLoadingStore } from '@/stores/useLoadingStore';
import { useGridFeatures } from '@/hooks/useGridFeatures';
import { exportToExcel } from './ExcelExport';
import { CheckboxFilter } from './CheckboxFilter';
import { ColumnSelector } from './ColumnSelector';
import { Modal } from '../ui/Modal';
import { coreNotify, useNotifyStore } from '@/stores/useNotifyStore';
import './agGridTheme.css';

ModuleRegistry.registerModules([AllCommunityModule]);

/** 페이지 재진입 시 서버 재조회 방지 — 1시간 TTL 모듈 레벨 캐시 */
const CACHE_TTL_MS = 60 * 60 * 1000;
const dataCache = new Map<string, { data: unknown[]; totalElements: number; timestamp: number }>();

/** localStorage 키 */
function colOrderKey(gridId: string): string {
  return `pm-col-order:${gridId}`;
}

/** 컬럼 field 배열로 간단한 해시 생성 */
function autoGridId<T>(cols: ColDef<T>[]): string {
  const key = cols.map((c) => c.field || c.colId || '').join(',');
  let h = 0;
  for (let i = 0; i < key.length; i++) {
    h = ((h << 5) - h + key.charCodeAt(i)) | 0;
  }
  return `auto-datagrid:${(h >>> 0).toString(36)}`;
}

interface PeakDataGridProps<T> {
  columns: ColDef<T>[];
  queryKey: string[];
  queryUrl: string;
  gridId?: string;
  enableSearch?: boolean;
  /** 외부에서 전달하는 검색 키워드. 제공 시 내부 keyword 대신 사용 */
  keyword?: string;
  pageSize?: number;
  onRowClick?: (row: T) => void;
  /** 툴바 좌측 영역 (타이틀 + 필터 등). 제공 시 검색과 함께 1줄로 렌더링 */
  toolbarLeft?: React.ReactNode;
  /** 추가 쿼리 파라미터 (날짜 범위 등) */
  extraParams?: Record<string, string | undefined>;
  /** 행 드래그로 정렬 순서 변경 활성화 */
  enableRowDrag?: boolean;
  /** 정렬 순서 일괄 변경 API URL (PUT). enableRowDrag 시 필수. body: [{id, sortOrder}] */
  reorderUrl?: string;
  /** 엑셀 파일명 (기본: 'export') */
  excelFileName?: string;
  /** 컬럼 체크박스 필터 활성화 (모든 컬럼에 CheckboxFilter 적용) */
  enableFilter?: boolean;
  /** 순번 컬럼 숨김 (시스템/기준정보 페이지용) */
  hideRowNumber?: boolean;
  /** 외부에서 값 변경 시 데이터 자동 재조회 트리거 (숫자를 증가시켜 사용) */
  refetchTrigger?: number;
  /** RBAC 권한. 미전달 시 모든 동작 허용 */
  permission?: { canExport?: boolean };
}

export function PeakDataGrid<T>({
  columns,
  queryUrl,
  gridId: gridIdProp,
  enableSearch = false,
  keyword: keywordProp,
  pageSize = 20,
  onRowClick,
  toolbarLeft,
  extraParams,
  enableRowDrag = false,
  reorderUrl,
  excelFileName = 'export',
  enableFilter = false,
  hideRowNumber = false,
  refetchTrigger,
  permission,
}: PeakDataGridProps<T>) {
  const gridRef = useRef<AgGridReact<T>>(null);
  const isResettingRef = useRef(false);
  const { t } = useTranslation();
  const prefStore = usePreferenceStore();
  const features = useGridFeatures();
  const errorHistory = useNotifyStore(s => s.errorHistory);
  const setErrorPanelOpen = useNotifyStore(s => s.setErrorPanelOpen);

  // ── 필터 사용 여부 (columnFilter 토글 또는 페이지 enableFilter prop) ──
  const useFilter = features.columnFilter || enableFilter;

  const gridId = useMemo(
    () => gridIdProp || autoGridId(columns),
    [gridIdProp, columns],
  );

  // ── 점진적 로딩 state ──
  const [allRows, setAllRows] = useState<T[]>([]);
  const [serverPage, setServerPage] = useState(0);
  const [hasMore, setHasMore] = useState(false);
  const [batchSize, setBatchSize] = useState(2000);
  const [isLoading, setIsLoading] = useState(false);
  const [totalElements, setTotalElements] = useState(0);

  const setLoading = useCallback((val: boolean) => {
    setIsLoading(val);
    if (val) useLoadingStore.getState().start();
    else useLoadingStore.getState().stop();
  }, []);

  // ── 페이지네이션 (AG Grid 동기화) ──
  const [currentPage, setCurrentPage] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [effectivePageSize, setEffectivePageSize] = useState<number>(() => {
    const saved = usePreferenceStore.getState().getGridPageSize();
    return saved ?? (pageSize ?? 25);
  });

  // ── 검색 state ──
  const [keyword, setKeyword] = useState('');
  const [allKeyword, setAllKeyword] = useState('');
  const [quickFilterText, setQuickFilterText] = useState('');
  const [debouncedQuickFilter, setDebouncedQuickFilter] = useState('');

  // ── 클립보드 모드 state ──
  const [clipboardMode, setClipboardMode] = useState(false);
  const [clipboardHelpOpen, setClipboardHelpOpen] = useState(false);
  const [rangeAnchor, setRangeAnchor] = useState<{ rowIndex: number; colIndex: number } | null>(null);
  const [rangeEnd, setRangeEnd] = useState<{ rowIndex: number; colIndex: number } | null>(null);

  // 빠른검색 디바운스 (300ms)
  useEffect(() => {
    const timer = setTimeout(() => setDebouncedQuickFilter(quickFilterText), 300);
    return () => clearTimeout(timer);
  }, [quickFilterText]);

  // ── 범위 해제: 클립보드 모드 끄면 범위 초기화 ──
  useEffect(() => {
    if (!clipboardMode) {
      setRangeAnchor(null);
      setRangeEnd(null);
    }
  }, [clipboardMode]);

  // ── 조회 시 사용된 파라미터 기록 (추가 batch 로드용) ──
  const committedParamsRef = useRef<Record<string, string | undefined>>({});

  // ── 컬럼 순서 (preferenceStore + localStorage 폴백) ──
  const defaultOrder = useMemo(
    () => columns.map((c) => c.field || c.colId || ''),
    [columns],
  );

  const [columnOrder, setColumnOrder] = useState<string[]>(() => {
    const fromStore = prefStore.getColOrder(gridId);
    if (fromStore) return fromStore;
    try {
      const saved = localStorage.getItem(colOrderKey(gridId));
      if (saved) return JSON.parse(saved);
    } catch { /* 컬럼 순서 복원 실패 — 기본 컬럼 순서 사용 */ }
    return defaultOrder;
  });

  // 서버 로드 완료 시 컬럼 순서 재적용
  useEffect(() => {
    if (!prefStore.loaded) return;
    const fromServer = prefStore.getColOrder(gridId);
    if (fromServer) setColumnOrder(fromServer);
  }, [prefStore.loaded, gridId]); // eslint-disable-line react-hooks/exhaustive-deps

  const isColumnOrderCustomized = useMemo(() => {
    if (defaultOrder.length !== columnOrder.length) return true;
    return defaultOrder.some((name, i) => name !== columnOrder[i]);
  }, [defaultOrder, columnOrder]);

  const [showResetConfirm, setShowResetConfirm] = useState(false);

  const executeResetColumnOrder = useCallback(() => {
    isResettingRef.current = true;
    setColumnOrder(defaultOrder);
    setSavedWidths(null);
    setHiddenColumns([]);
    hasCustomWidthsRef.current = false;
    setWidthsCustomized(false);
    prefStore.removeColOrder(gridId);
    prefStore.removeColWidths(gridId);
    prefStore.removeColHidden(gridId);
    try { localStorage.removeItem(colOrderKey(gridId)); } catch { /* 컬럼 순서 초기화 실패 — 다음 저장 시 덮어쓰기 */ }
    const api = gridRef.current?.api;
    if (api) {
      const prefix: { colId: string; pinned: null }[] = [];
      if (enableRowDrag) prefix.push({ colId: '__drag', pinned: null });
      if (!hideRowNumber && features.rowNumber) prefix.push({ colId: '__rowNum', pinned: null });
      const defaultState = [
        ...prefix,
        ...defaultOrder.filter(Boolean).map((colId) => ({ colId, pinned: null as string | null })),
      ];
      api.applyColumnState({ state: defaultState, applyOrder: true });
      setTimeout(() => {
        api.autoSizeAllColumns();
        isResettingRef.current = false;
      }, 0);
    } else {
      isResettingRef.current = false;
    }
  }, [defaultOrder, gridId, prefStore, enableRowDrag, hideRowNumber, features.rowNumber]);

  const handleResetColumnOrder = useCallback(() => {
    setShowResetConfirm(true);
  }, []);

  const handleResetConfirm = useCallback(() => {
    setShowResetConfirm(false);
    executeResetColumnOrder();
  }, [executeResetColumnOrder]);

  const handleFitColumns = useCallback(() => {
    const api = gridRef.current?.api;
    if (!api) return;
    api.sizeColumnsToFit();
    setTimeout(() => {
      const widths: Record<string, number> = {};
      api.getColumnState().forEach((cs) => {
        if (cs.colId !== '__drag' && cs.colId !== '__rowNum') {
          widths[cs.colId] = cs.width;
        }
      });
      hasCustomWidthsRef.current = true;
      setWidthsCustomized(true);
      prefStore.setColWidths(gridId, widths);
    }, 0);
  }, [gridId, prefStore]);

  const handleAutoSizeColumns = useCallback(() => {
    const api = gridRef.current?.api;
    if (!api) return;
    api.autoSizeAllColumns();
  }, []);

  // ── 컬럼 폭 (preferenceStore + localStorage 폴백) ──
  const [savedWidths, setSavedWidths] = useState<Record<string, number> | null>(() => {
    return prefStore.getColWidths(gridId);
  });
  const hasCustomWidthsRef = useRef(!!savedWidths);
  const [widthsCustomized, setWidthsCustomized] = useState(!!savedWidths);

  // 서버 로드 완료 시 컬럼 폭 재적용
  useEffect(() => {
    if (!prefStore.loaded) return;
    const fromServer = prefStore.getColWidths(gridId);
    if (fromServer) {
      setSavedWidths(fromServer);
      hasCustomWidthsRef.current = true;
      setWidthsCustomized(true);
      const api = gridRef.current?.api;
      if (api) {
        const colState = api.getColumnState().map((cs) => ({
          ...cs,
          width: fromServer[cs.colId] ?? cs.width,
        }));
        api.applyColumnState({ state: colState });
      }
    }
  }, [prefStore.loaded, gridId]); // eslint-disable-line react-hooks/exhaustive-deps

  // ── 컬럼 숨김 (preferenceStore) ──
  const [hiddenColumns, setHiddenColumns] = useState<string[]>(() => {
    return prefStore.getColHidden(gridId) || [];
  });

  useEffect(() => {
    if (!prefStore.loaded) return;
    const fromServer = prefStore.getColHidden(gridId);
    if (fromServer) setHiddenColumns(fromServer);
  }, [prefStore.loaded, gridId]);

  const handleHiddenColumnsChange = useCallback((hidden: string[]) => {
    setHiddenColumns(hidden);
    if (hidden.length === 0) {
      prefStore.removeColHidden(gridId);
    } else {
      prefStore.setColHidden(gridId, hidden);
    }
    // 숨김 변경 후 컬럼 가시성을 AG Grid API로 직접 적용
    setTimeout(() => {
      const api = gridRef.current?.api;
      if (!api) return;
      const allCols = columns.map((c) => c.field || c.colId || '').filter(Boolean);
      for (const colId of allCols) {
        api.setColumnsVisible([colId], !hidden.includes(colId));
      }
      api.autoSizeAllColumns();
    }, 0);
  }, [gridId, prefStore, columns]);

  // 컬럼 순서 적용 + 저장된 폭 적용 + 기능 토글
  const orderedColumns = useMemo(() => {
    const processed = columns.map((c) => {
      const colId = c.field || c.colId || '';
      const isNumber = c.type === 'numericColumn';
      const isHidden = hiddenColumns.includes(colId);
      return {
        ...c,
        ...(isHidden ? { hide: true } : {}),
        ...(savedWidths?.[colId] ? { width: savedWidths[colId], flex: undefined } : {}),
        ...(isNumber && features.autoFormat && !c.valueFormatter ? {
          valueFormatter: (p: { value: unknown }) => {
            if (p.value == null || p.value === '') return '';
            const num = Number(p.value);
            if (isNaN(num)) return String(p.value);
            return num.toLocaleString('ko-KR');
          },
        } : {}),
        ...(isNumber && features.conditionalStyle && !c.cellStyle ? {
          cellStyle: (p: { value: unknown }) => {
            const num = Number(p.value);
            return { textAlign: 'right' as const, ...(num < 0 ? { color: '#dc2626' } : {}) };
          },
        } : {}),
        ...(features.tooltip && !c.tooltipValueGetter ? {
          tooltipValueGetter: (p: { value: unknown }) => p.value != null ? String(p.value) : '',
        } : {}),
      };
    });
    const colMap = new Map(processed.map((c) => [c.field || c.colId || '', c]));
    const result: ColDef<T>[] = [];
    for (const id of columnOrder) {
      const col = colMap.get(id);
      if (col) {
        result.push(col);
        colMap.delete(id);
      }
    }
    for (const col of colMap.values()) {
      result.push(col);
    }
    return result;
  }, [columns, columnOrder, savedWidths, hiddenColumns, features]);

  // ── 데이터 fetch ──
  const fetchBatch = useCallback(async (page: number, size: number, params: Record<string, string | undefined>) => {
    const sp = new URLSearchParams();
    sp.set('page', String(page));
    sp.set('size', String(size));
    sp.set('sort', enableRowDrag ? 'sortOrder' : 'id');
    sp.set('direction', 'ASC');
    Object.entries(params).forEach(([k, v]) => {
      if (v !== undefined && v !== '') sp.set(k, v);
    });
    const res = await authFetch(`/api${queryUrl}?${sp}`);
    if (!res.ok) throw new Error('데이터 조회에 실패했습니다.');
    const json: ApiResponse<PagedResponse<T>> = await res.json();
    return json.data;
  }, [queryUrl, enableRowDrag]);

  // ── 버튼 1: 조건 조회 (항상 서버 재조회 + 캐시 갱신) ──
  const handleSearch = useCallback(async () => {
    const effectiveKw = keywordProp !== undefined ? keywordProp : keyword;
    const params: Record<string, string | undefined> = { ...extraParams };
    if (effectiveKw) params.keyword = effectiveKw;
    committedParamsRef.current = params;
    setLoading(true);
    try {
      const result = await fetchBatch(0, batchSize, params);
      setAllRows(result.content);
      setServerPage(0);
      setHasMore(result.last === false);
      setTotalElements(result.totalElements);
      dataCache.set(`${queryUrl}|${JSON.stringify(params)}`, {
        data: result.content as unknown[],
        totalElements: result.totalElements,
        timestamp: Date.now(),
      });
    } catch (err) {
      coreNotify(err instanceof Error ? err.message : '데이터 조회에 실패했습니다.', { type: 'error' });
      setAllRows([]);
      setHasMore(false);
      setTotalElements(0);
    } finally {
      setLoading(false);
    }
  }, [fetchBatch, batchSize, keyword, keywordProp, extraParams, queryUrl]);

  // ── 첫 마운트 전용: 캐시 우선, 없으면 서버 조회 ──
  const handleSearchCached = useCallback(async () => {
    const effectiveKw = keywordProp !== undefined ? keywordProp : keyword;
    const params: Record<string, string | undefined> = { ...extraParams };
    if (effectiveKw) params.keyword = effectiveKw;
    const cacheKey = `${queryUrl}|${JSON.stringify(params)}`;
    const cached = dataCache.get(cacheKey);
    if (cached && Date.now() - cached.timestamp < CACHE_TTL_MS) {
      committedParamsRef.current = params;
      setAllRows(cached.data as T[]);
      setServerPage(0);
      setHasMore(false);
      setTotalElements(cached.totalElements);
      return;
    }
    await handleSearch();
  }, [handleSearch, queryUrl, keyword, keywordProp, extraParams]);

  // ── 마지막 페이지 Next: 추가 로딩 ──
  const fetchNextBatch = useCallback(async () => {
    const nextPage = serverPage + 1;
    setLoading(true);
    try {
      const result = await fetchBatch(nextPage, batchSize, committedParamsRef.current);
      setServerPage(nextPage);
      let targetPage = 0;
      setAllRows(prev => {
        targetPage = Math.floor(prev.length / effectivePageSize);
        return [...prev, ...result.content];
      });
      setHasMore(result.last === false);
      // 추가 로드 후 새 데이터의 첫 페이지로 이동
      setTimeout(() => {
        gridRef.current?.api?.paginationGoToPage(targetPage);
      }, 50);
    } finally {
      setLoading(false);
    }
  }, [fetchBatch, batchSize, serverPage, effectivePageSize]);

  // ── 버튼 2: 서버전체검색 ──
  const handleSearchAll = useCallback(async () => {
    setLoading(true);
    try {
      const result = await fetchBatch(0, 999999, { keyword: allKeyword || undefined });
      setAllRows(result.content);
      setServerPage(0);
      setHasMore(false);
      setTotalElements(result.totalElements);
    } catch (err) {
      coreNotify(err instanceof Error ? err.message : '데이터 조회에 실패했습니다.', { type: 'error' });
      setAllRows([]);
      setHasMore(false);
      setTotalElements(0);
    } finally {
      setLoading(false);
    }
  }, [fetchBatch, allKeyword]);

  // ── 초기 로드 + 외부 트리거 재조회 ──
  const handleSearchRef = useRef(handleSearch);
  handleSearchRef.current = handleSearch;
  const handleSearchCachedRef = useRef(handleSearchCached);
  handleSearchCachedRef.current = handleSearchCached;
  const isMountedRef = useRef(false);
  useEffect(() => {
    if (!isMountedRef.current) {
      isMountedRef.current = true;
      handleSearchCachedRef.current(); // 첫 마운트: 캐시 우선
    } else {
      handleSearchRef.current(); // refetchTrigger 변경: 항상 서버 재조회
    }
  }, [refetchTrigger]); // eslint-disable-line react-hooks/exhaustive-deps

  // ── AG Grid 페이지네이션 동기화 ──
  const onPaginationChanged = useCallback(() => {
    const api = gridRef.current?.api;
    if (!api) return;
    setCurrentPage(api.paginationGetCurrentPage());
    setTotalPages(api.paginationGetTotalPages());
  }, []);

  // ── Prev/Next ──
  const handlePrev = useCallback(() => {
    gridRef.current?.api?.paginationGoToPreviousPage();
  }, []);

  const handleNext = useCallback(() => {
    const api = gridRef.current?.api;
    if (!api) return;
    const isLastPage = currentPage >= totalPages - 1;
    if (isLastPage && hasMore) {
      fetchNextBatch();
    } else {
      api.paginationGoToNextPage();
    }
  }, [currentPage, totalPages, hasMore, fetchNextBatch]);

  const handlePageSizeChange = useCallback((size: number) => {
    setEffectivePageSize(size);
    gridRef.current?.api?.paginationSetPageSize(size);
    gridRef.current?.api?.paginationGoToPage(0);
    usePreferenceStore.getState().setGridPageSize(size);
  }, []);

  // ── AG Grid 이벤트 ──
  const onRowClicked = useCallback(
    (e: { data: T | undefined }) => {
      if (onRowClick && e.data && !(e.data as Record<string, unknown>).__isTotal) onRowClick(e.data);
    },
    [onRowClick],
  );

  const onColumnMoved = useCallback(() => {
    if (isResettingRef.current) return;
    const api = gridRef.current?.api;
    if (!api) return;
    const colState = api.getColumnState();
    const newOrder = colState
      .map((c) => c.colId)
      .filter((id) => id !== '__drag' && id !== '__rowNum');
    setColumnOrder(newOrder);
    prefStore.setColOrder(gridId, newOrder);
    const widths: Record<string, number> = {};
    colState.forEach((cs) => {
      if (cs.colId !== '__drag' && cs.colId !== '__rowNum') {
        widths[cs.colId] = cs.width;
      }
    });
    setSavedWidths(widths);
    prefStore.setColWidths(gridId, widths);
    setTimeout(() => api.autoSizeAllColumns(), 0);
  }, [gridId, prefStore]);

  const onColumnResized = useCallback((e: ColumnResizedEvent<T>) => {
    if (!e.finished || e.source === 'sizeColumnsToFit') return;
    const api = gridRef.current?.api;
    if (!api) return;
    const widths: Record<string, number> = {};
    api.getColumnState().forEach((cs) => {
      if (cs.colId !== '__drag' && cs.colId !== '__rowNum') {
        widths[cs.colId] = cs.width;
      }
    });
    hasCustomWidthsRef.current = true;
    if (!widthsCustomized) setWidthsCustomized(true);
    prefStore.setColWidths(gridId, widths);
  }, [gridId, prefStore, widthsCustomized]);

  // ── 엑셀 내보내기 ──
  const handleExcel = useCallback(() => {
    const api = gridRef.current?.api;
    if (!api) return;
    const total = allRows.length;
    if (total > 5000) {
      coreNotify(`다운로드 제한 리스트는 5,000건 입니다. 현재 ${total.toLocaleString()}건 이기 때문에 필터 조건을 좁혀주세요`, { type: 'warning' });
      return;
    }
    exportToExcel({ api: api as never, columnDefs: columns as ColDef[], fileName: excelFileName, rows: allRows as Record<string, unknown>[] });
  }, [columns, excelFileName, allRows]);

  // ── CSV 내보내기 ──
  const handleCsvExport = useCallback(() => {
    const api = gridRef.current?.api;
    if (!api) return;
    api.exportDataAsCsv({ fileName: `${excelFileName}.csv` });
  }, [excelFileName]);

  // ── Clipboard: Ctrl+C 복사 ──
  const handleClipboardCopy = useCallback(() => {
    const api = gridRef.current?.api;
    if (!api) return;

    const focusedCell = api.getFocusedCell();
    if (!focusedCell) return;

    const visibleCols = api.getAllDisplayedColumns()
      .filter((c) => c.getColId() !== '__rowNum' && c.getColId() !== '__drag');

    // 1) 사각형 범위 선택이 있으면 범위 복사
    if (rangeAnchor && rangeEnd) {
      const minRow = Math.min(rangeAnchor.rowIndex, rangeEnd.rowIndex);
      const maxRow = Math.max(rangeAnchor.rowIndex, rangeEnd.rowIndex);
      const minCol = Math.min(rangeAnchor.colIndex, rangeEnd.colIndex);
      const maxCol = Math.max(rangeAnchor.colIndex, rangeEnd.colIndex);

      const rangeCols = visibleCols.slice(minCol, maxCol + 1);
      const header = rangeCols.map((c) => c.getColDef().headerName ?? c.getColId()).join('\t');
      const rows: string[] = [];
      for (let r = minRow; r <= maxRow; r++) {
        const node = api.getDisplayedRowAtIndex(r);
        if (!node?.data) continue;
        rows.push(
          rangeCols.map((col) => {
            const field = col.getColDef().field;
            const val = field ? (node.data as Record<string, unknown>)[field] : '';
            return val != null ? String(val) : '';
          }).join('\t'),
        );
      }
      navigator.clipboard.writeText([header, ...rows].join('\n')).catch(() => {}); // 클립보드 권한 거부 시 복사 건너뜀
      return;
    }

    // 2) 포커스된 단일 셀 복사
    const node = api.getDisplayedRowAtIndex(focusedCell.rowIndex);
    if (!node?.data) return;
    const field = focusedCell.column.getColDef().field;
    const val = field ? (node.data as Record<string, unknown>)[field] : '';
    navigator.clipboard.writeText(val != null ? String(val) : '').catch(() => {}); // 클립보드 권한 거부 시 복사 건너뜀
  }, [rangeAnchor, rangeEnd]);

  // ── Clipboard: 셀 클릭 시 범위 선택 ──
  const onCellClickedForRange = useCallback((e: CellClickedEvent<T>) => {
    if (!clipboardMode) return;
    const api = gridRef.current?.api;
    if (!api) return;
    const visibleCols = api.getAllDisplayedColumns()
      .filter((c) => c.getColId() !== '__rowNum' && c.getColId() !== '__drag');
    const colIndex = visibleCols.findIndex((c) => c.getColId() === e.column.getColId());
    if (colIndex < 0) return;
    const rowIndex = e.rowIndex ?? 0;
    const event = e.event as MouseEvent | undefined;
    if (event?.shiftKey && rangeAnchor) {
      setRangeEnd({ rowIndex, colIndex });
    } else {
      setRangeAnchor({ rowIndex, colIndex });
      setRangeEnd(null);
    }
  }, [clipboardMode, rangeAnchor]);

  // ── Clipboard: 범위 하이라이트 (DOM 기반) ──
  useEffect(() => {
    const wrapper = gridWrapperRef.current;
    if (!wrapper) return;
    const cls = 'ag-cell-range-selected';
    wrapper.querySelectorAll(`.${cls}`).forEach((el) => el.classList.remove(cls));

    if (!rangeAnchor || !rangeEnd) return;
    const api = gridRef.current?.api;
    if (!api) return;

    const visibleCols = api.getAllDisplayedColumns()
      .filter((c) => c.getColId() !== '__rowNum' && c.getColId() !== '__drag');
    const minRow = Math.min(rangeAnchor.rowIndex, rangeEnd.rowIndex);
    const maxRow = Math.max(rangeAnchor.rowIndex, rangeEnd.rowIndex);
    const minCol = Math.min(rangeAnchor.colIndex, rangeEnd.colIndex);
    const maxCol = Math.max(rangeAnchor.colIndex, rangeEnd.colIndex);

    for (let r = minRow; r <= maxRow; r++) {
      for (let ci = minCol; ci <= maxCol; ci++) {
        const col = visibleCols[ci];
        if (!col) continue;
        const colId = col.getColId();
        const cellEl = wrapper.querySelector(
          `[row-index="${r}"] [col-id="${colId}"]`,
        );
        if (cellEl) cellEl.classList.add(cls);
      }
    }
  }, [rangeAnchor, rangeEnd]);

  // ── Clipboard: Ctrl+C 키보드 핸들러 ──
  const onCellKeyDown = useCallback((e: CellKeyDownEvent<T>) => {
    const event = e.event as KeyboardEvent | undefined;
    if (!event) return;
    if ((event.ctrlKey || event.metaKey) && event.key === 'c') {
      event.preventDefault();
      handleClipboardCopy();
    }
  }, [handleClipboardCopy]);

  // ── 하단 소계: 클립보드 모드에서 포커스 셀 아래에 소계 행 삽입 ──
  const handleBottomSubtotal = useCallback(() => {
    const api = gridRef.current?.api;
    if (!api) return;
    const focusedCell = api.getFocusedCell();
    if (!focusedCell) { coreNotify('소계를 삽입할 셀을 먼저 클릭하세요.', { type: 'info' }); return; }

    const targetRowIdx = focusedCell.rowIndex;
    const targetRow = allRows[targetRowIdx] as Record<string, unknown> | undefined;
    if (!targetRow || targetRow.__isTotal) return;

    // 숫자 컬럼 필드 목록
    const numFields = columns
      .filter((c) => c.type === 'numericColumn' && c.field)
      .map((c) => c.field!);

    const focusedField = focusedCell.column.getColId();
    const startIdx = Math.max(0, numFields.indexOf(focusedField));

    // 소계 행 생성
    const subtotalRow: Record<string, unknown> = { __isTotal: true };
    for (const c of columns) {
      if (c.field) subtotalRow[c.field] = '';
    }

    // 포커스 열 이전 필드는 null
    for (let i = 0; i < startIdx; i++) {
      subtotalRow[numFields[i]] = null;
    }

    // 소계 라벨: 첫 번째 텍스트 필드에 "소계"
    const firstTextField = columns.find((c) => c.type !== 'numericColumn' && c.field);
    if (firstTextField?.field) subtotalRow[firstTextField.field] = '소계';

    // 포커스 셀 기준으로 위쪽 data 행들의 합계 계산
    // 이전 소계/__isTotal 행까지가 범위
    let rangeStart = 0;
    for (let j = targetRowIdx; j >= 0; j--) {
      const row = allRows[j] as Record<string, unknown>;
      if (row.__isTotal) {
        rangeStart = j + 1;
        break;
      }
    }

    for (let fi = startIdx; fi < numFields.length; fi++) {
      const field = numFields[fi];
      let sum = 0;
      let hasValue = false;
      for (let j = rangeStart; j <= targetRowIdx; j++) {
        const dr = allRows[j] as Record<string, unknown>;
        if (dr.__isTotal) continue;
        const val = Number(dr[field]);
        if (!isNaN(val)) {
          sum += val;
          hasValue = true;
        }
      }
      subtotalRow[field] = hasValue ? sum : null;
    }

    // 삽입: allRows 복사 후 삽입
    const newRows = [...allRows];
    newRows.splice(targetRowIdx + 1, 0, subtotalRow as T);
    setAllRows(newRows);
  }, [allRows, columns]);

  // ── Row Drag ──
  const handleSearchForReorder = useRef(handleSearch);
  handleSearchForReorder.current = handleSearch;
  const onRowDragEnd = useCallback(
    async (e: RowDragEndEvent<T>) => {
      if (!reorderUrl) return;
      const api = e.api;
      const rowData: T[] = [];
      api.forEachNode((node) => {
        if (node.data) rowData.push(node.data);
      });
      const updates = rowData.map((item, i) => ({
        id: (item as Record<string, unknown>).id,
        sortOrder: i + 1,
      }));
      try {
        await authFetch(reorderUrl, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(updates),
        });
        handleSearchForReorder.current();
      } catch { /* 컬럼 순서 서버 동기화 실패 — 현재 세션에는 영향 없음 */ }
    },
    [reorderUrl],
  );

  // ── 특수 컬럼 (드래그 + 순번) ──
  const effectiveColumns = useMemo(() => {
    const baseCols = orderedColumns.map((c) => ({
      ...c,
      sortable: c.sortable !== false,
    }));
    const prefix: ColDef<T>[] = [];
    if (enableRowDrag) {
      prefix.push({
        colId: '__drag',
        headerName: '',
        width: 40,
        maxWidth: 40,
        rowDrag: true,
        sortable: false,
        suppressMovable: true,
        cellStyle: { cursor: 'grab' },
      });
    }
    if (!hideRowNumber && features.rowNumber) {
      prefix.push({
        colId: '__rowNum',
        headerName: 'No.',
        width: 55,
        maxWidth: 70,
        sortable: false,
        filter: false,
        suppressMovable: true,
        cellStyle: { textAlign: 'center' },
        valueGetter: (params) =>
          (params.node?.rowPinned || (params.data as Record<string, unknown> | undefined)?.__isTotal)
            ? '' : (params.node ? (params.node.rowIndex ?? 0) + 1 : ''),
      });
    }
    return [...prefix, ...baseCols];
  }, [orderedColumns, enableRowDrag, hideRowNumber, features.rowNumber]);

  // ── totalRow: 숫자 컬럼 합계 자동 계산 (누적 전체 데이터) ──
  const totalRowData = useMemo(() => {
    if (features.totalRowType === 'off') return null;
    if (allRows.length === 0) return null;
    const numericFields = columns
      .filter((c) => c.type === 'numericColumn' && c.field)
      .map((c) => c.field!);
    if (numericFields.length === 0) return null;

    const totals: Record<string, unknown> = { __isTotal: true };
    for (const c of columns) {
      if (c.field) totals[c.field] = '';
    }
    for (const field of numericFields) {
      let sum = 0;
      for (const row of allRows) {
        const val = Number((row as Record<string, unknown>)[field]);
        if (!isNaN(val)) sum += val;
      }
      totals[field] = sum;
    }
    const firstTextField = columns.find((c) => c.type !== 'numericColumn' && c.field);
    if (firstTextField?.field) totals[firstTextField.field] = t('common.total');
    return totals;
  }, [features.totalRowType, columns, allRows, t]);

  const pinnedBottomRowData = useMemo(() => {
    if (features.totalRowType !== 'pinned' || !totalRowData) return [];
    return [totalRowData];
  }, [features.totalRowType, totalRowData]);

  const effectiveRowData = useMemo(() => {
    if (features.totalRowType !== 'inline' || !totalRowData) return allRows;
    return [...allRows, totalRowData as T];
  }, [allRows, features.totalRowType, totalRowData]);

  // ── getRowClass: inline 합계 행 CSS 클래스 ──
  const getRowClass = useCallback((params: RowClassParams<T>) => {
    if ((params.data as Record<string, unknown> | undefined)?.__isTotal) return 'ag-total-row';
    return undefined;
  }, []);

  // ── columnTypes: numericColumn 내장 타입 오버라이드 ──
  const columnTypes = useMemo<Record<string, ColTypeDef<T>>>(() => ({
    numericColumn: {
      headerClass: 'ag-right-aligned-header',
      cellClass: 'ag-right-aligned-cell',
      filter: useFilter ? CheckboxFilter : true,
    },
  }), [useFilter]);

  // ── 기본 컬럼 설정 ──
  const defaultColDef = useMemo<ColDef<T>>(
    () => ({
      resizable: true,
      sortable: true,
      minWidth: 80,
      filter: useFilter ? CheckboxFilter : true,
      lockPinned: !features.columnPinning,
    }),
    [useFilter, features.columnPinning],
  );

  // ── 컬럼 핀 고정 컨텍스트 메뉴 (Community 대체) ──
  const gridWrapperRef = useRef<HTMLDivElement>(null);
  const [pinMenu, setPinMenu] = useState<{ x: number; y: number; colId: string } | null>(null);

  useEffect(() => {
    if (!features.columnPinning) return;
    const wrapper = gridWrapperRef.current;
    if (!wrapper) return;
    const onCtx = (e: MouseEvent) => {
      const hc = (e.target as HTMLElement).closest('.ag-header-cell') as HTMLElement | null;
      if (!hc || !hc.closest('.ag-header')) return;
      const colId = hc.getAttribute('col-id');
      if (!colId || colId === '__drag' || colId === '__rowNum') return;
      e.preventDefault();
      e.stopPropagation();
      setPinMenu({ x: e.clientX, y: e.clientY, colId });
    };
    wrapper.addEventListener('contextmenu', onCtx);
    return () => wrapper.removeEventListener('contextmenu', onCtx);
  }, [features.columnPinning]);

  useEffect(() => {
    if (!pinMenu) return;
    const close = () => setPinMenu(null);
    document.addEventListener('click', close);
    document.addEventListener('contextmenu', close);
    return () => { document.removeEventListener('click', close); document.removeEventListener('contextmenu', close); };
  }, [pinMenu]);

  const handleFreezePane = useCallback((colId: string) => {
    const api = gridRef.current?.api;
    if (!api) return;
    const colState = api.getColumnState();
    const targetIdx = colState.findIndex((cs) => cs.colId === colId);
    if (targetIdx < 0) return;
    const newState = colState.map((cs, i) => ({
      ...cs,
      pinned: i <= targetIdx ? ('left' as const) : null,
    }));
    api.applyColumnState({ state: newState });
    setPinMenu(null);
  }, []);

  const handleUnfreezePane = useCallback(() => {
    const api = gridRef.current?.api;
    if (!api) return;
    const colState = api.getColumnState();
    const newState = colState.map((cs) => ({ ...cs, pinned: null }));
    api.applyColumnState({ state: newState });
    setPinMenu(null);
  }, []);

  // ── 사이즈 맞춤 ──
  const onGridReady = useCallback(() => {
    // 초기 로드 시 사이즈 맞춤은 데이터 로드 후
  }, []);

  const onFirstDataRendered = useCallback(() => {
    if (!hasCustomWidthsRef.current) gridRef.current?.api?.autoSizeAllColumns();
  }, []);

  useEffect(() => {
    const handleResize = () => {
      if (!hasCustomWidthsRef.current) gridRef.current?.api?.autoSizeAllColumns();
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const isCustomized = isColumnOrderCustomized || widthsCustomized;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', flex: 1, minHeight: 0 }}>
      <div className="grid-toolbar" style={{ flexShrink: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap', minWidth: 0 }}>
          {toolbarLeft}
          <button
            onClick={handleResetColumnOrder}
            className="mes-btn"
            title={t('grid.resetColumnTitle')}
          >
            {t('grid.resetColumn')}
          </button>
          {features.quickFilter && (
            <input
              placeholder={t('grid.quickFilter')}
              value={quickFilterText}
              onChange={(e) => setQuickFilterText(e.target.value)}
              style={{ fontSize: 'var(--font-size-sm)', padding: '2px 8px', border: '1px solid var(--color-border)', borderRadius: 3, height: 24, width: 160 }}
            />
          )}
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
          <select
            value={batchSize}
            onChange={(e) => setBatchSize(Number(e.target.value))}
            title={t('grid.batchSize')}
            style={{ height: 28 }}
          >
            <option value={2000}>2,000</option>
            <option value={4000}>4,000</option>
            <option value={6000}>6,000</option>
            <option value={8000}>8,000</option>
            <option value={10000}>10,000</option>
          </select>
          <button
            onClick={handleSearch}
            className="mes-btn mes-btn-search"
          >
            {t('grid.search')}
          </button>
          {enableSearch && (
            <>
              <span style={{ color: 'var(--color-border)', margin: '0 2px' }}>|</span>
              <input
                placeholder={t('grid.searchAllPlaceholder')}
                value={allKeyword}
                onChange={(e) => setAllKeyword(e.target.value)}
                onKeyDown={(e) => { if (e.key === 'Enter') handleSearchAll(); }}
              />
              <button
                onClick={handleSearchAll}
                className="mes-btn mes-btn-search"
              >
                {t('grid.searchAll')}
              </button>
            </>
          )}
        </div>
      </div>

      <div ref={gridWrapperRef} className={`ag-theme-mes${clipboardMode ? ' clipboard-mode' : ''}`} style={{ flex: 1, minHeight: 0, position: 'relative' }} aria-label={t('grid.dataGrid', '데이터 그리드')} aria-busy={isLoading}>
        <AgGridReact<T>
          ref={gridRef}
          rowData={effectiveRowData}
          columnDefs={effectiveColumns}
          defaultColDef={defaultColDef}
          columnTypes={columnTypes}
          pagination={true}
          paginationPageSize={effectivePageSize}
          suppressPaginationPanel={true}
          onPaginationChanged={onPaginationChanged}
          onRowClicked={onRowClicked}
          onCellClicked={onCellClickedForRange}
          onCellKeyDown={clipboardMode ? onCellKeyDown : undefined}
          onColumnMoved={onColumnMoved}
          onColumnResized={onColumnResized}
          onGridReady={onGridReady}
          onFirstDataRendered={onFirstDataRendered}
          onRowDragEnd={enableRowDrag ? onRowDragEnd : undefined}
          rowDragManaged={enableRowDrag}
          animateRows={features.animation || enableRowDrag}
          loading={isLoading}
          overlayNoRowsTemplate={`<span>${t('common.noData')}</span>`}
          overlayLoadingTemplate='<span></span>'
          rowSelection="single"
          suppressCellFocus={!clipboardMode}
          domLayout="normal"
          getRowId={undefined}
          enableBrowserTooltips={features.tooltip}
          enableCellTextSelection={features.textSelection}
          ensureDomOrder={features.textSelection}
          getRowClass={getRowClass}
          pinnedBottomRowData={pinnedBottomRowData}
          quickFilterText={debouncedQuickFilter || undefined}
          reactiveCustomComponents={true}
        />
        {pinMenu && (
          <div
            className="ag-pin-context-menu"
            style={{ position: 'fixed', top: pinMenu.y, left: pinMenu.x, zIndex: 9999,
              background: 'var(--color-bg, #fff)', border: '1px solid var(--color-border, #e2e8f0)',
              borderRadius: 4, boxShadow: '0 2px 8px rgba(0,0,0,0.15)', padding: '4px 0',
              fontSize: 'var(--grid-font-size, 13px)', minWidth: 120 }}
          >
            <div className="ag-pin-menu-item" onClick={() => handleFreezePane(pinMenu.colId)}
              style={{ padding: '6px 12px', cursor: 'pointer' }}
              onMouseEnter={(e) => (e.currentTarget.style.background = 'var(--grid-row-hover, #f1f5f9)')}
              onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
            >
              {t('grid.freezePane')}
            </div>
            <div className="ag-pin-menu-item" onClick={handleUnfreezePane}
              style={{ padding: '6px 12px', cursor: 'pointer' }}
              onMouseEnter={(e) => (e.currentTarget.style.background = 'var(--grid-row-hover, #f1f5f9)')}
              onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
            >
              {t('grid.unfreezePane')}
            </div>
          </div>
        )}
      </div>

      <div className="pagination" style={{ flexShrink: 0 }}>
        <div style={{ flex: 1, display: 'flex', gap: 4 }}>
          {permission?.canExport !== false && (
            <button
              onClick={handleExcel}
              className="mes-btn"
              title={t('grid.excelTitle')}
            >
              {t('grid.excel')}
            </button>
          )}
          {features.csvExport && permission?.canExport !== false && (
            <button
              onClick={handleCsvExport}
              className="mes-btn"
              title={t('grid.csvTitle')}
            >
              CSV
            </button>
          )}
          <ColumnSelector
            columns={columns}
            hiddenColumns={hiddenColumns}
            onHiddenColumnsChange={handleHiddenColumnsChange}
            label={t('grid.columnSelector')}
          />
          <button
            onClick={handleFitColumns}
            className="mes-btn"
            title={t('grid.fitColumnsTitle')}
          >
            {t('grid.fitColumns')}
          </button>
          <button
            onClick={handleAutoSizeColumns}
            className="mes-btn"
            title="컬럼 폭을 데이터 내용에 맞게 자동 조절"
          >
            컬럼자동조정
          </button>
          <button
            onClick={() => setClipboardMode((v) => !v)}
            className={`mes-btn${clipboardMode ? ' mes-btn-clipboard-active' : ''}`}
            style={clipboardMode ? undefined : { backgroundColor: 'transparent', borderColor: '#2563eb', color: '#2563eb' }}
            title={t('grid.clipboardModeTitle')}
          >
            {clipboardMode ? t('grid.clipboardModeOn') : t('grid.clipboardModeOff')}
          </button>
          {clipboardMode && (
            <button
              onClick={handleBottomSubtotal}
              className="mes-btn"
              title="선택한 셀 하단에 소계 행이 추가되며, 선택한 셀을 포함한 우측에 해당 열의 소계값이 계산됩니다"
            >
              하단 소계
            </button>
          )}
          <button
            onClick={() => setClipboardHelpOpen(true)}
            className="mes-btn"
            style={{ padding: '2px 7px', fontSize: 'var(--font-size-base)', fontWeight: 700, borderRadius: '50%', minWidth: 0, lineHeight: 1 }}
            title={t('grid.clipboardHelp')}
          >
            ?
          </button>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
          <button
            onClick={() => gridRef.current?.api?.paginationGoToPage(0)}
            disabled={currentPage === 0}
            title="첫 페이지"
          >
            «
          </button>
          <button onClick={handlePrev} disabled={currentPage === 0}>
            {t('grid.prev')}
          </button>
          <input
            type="number"
            min={1}
            max={totalPages || 1}
            value={currentPage + 1}
            onChange={(e) => {
              const v = parseInt(e.target.value, 10);
              if (!isNaN(v) && v >= 1 && v <= (totalPages || 1)) {
                gridRef.current?.api?.paginationGoToPage(v - 1);
              }
            }}
            onKeyDown={(e) => { if (e.key === 'Enter') e.currentTarget.blur(); }}
            style={{
              width: 42, textAlign: 'center', padding: '0 4px',
              border: '1px solid var(--color-border)', borderRadius: 4,
              height: 26, fontSize: 'var(--font-size-sm)',
            }}
          />
          <span style={{ fontSize: 'var(--font-size-sm)', color: 'var(--color-text-secondary)' }}>
            / {totalPages || 1}
          </span>
          <button onClick={handleNext} disabled={currentPage >= (totalPages || 1) - 1 && !hasMore}>
            {t('grid.next')}
          </button>
          <button
            onClick={() => gridRef.current?.api?.paginationGoToPage((totalPages || 1) - 1)}
            disabled={currentPage >= (totalPages || 1) - 1}
            title="마지막 페이지"
          >
            »
          </button>
          {hasMore && currentPage >= (totalPages || 1) - 1 && (
            <button onClick={fetchNextBatch} disabled={isLoading} className="mes-btn mes-btn-search" style={{ marginLeft: 4 }}>
              {t('grid.fetchMore')}
            </button>
          )}
        </div>
        <div style={{ flex: 1, display: 'flex', justifyContent: 'flex-end', alignItems: 'center', gap: 12 }}>
          <select
            value={effectivePageSize}
            onChange={(e) => handlePageSizeChange(Number(e.target.value))}
            style={{ fontSize: 'var(--font-size-sm, 12px)', padding: '2px 4px', border: '1px solid var(--color-border)', borderRadius: 3, height: 24, cursor: 'pointer', background: 'var(--color-surface, #fff)', color: 'var(--color-text, #111)' }}
            title="페이지당 행 수"
          >
            {[25, 50, 100, 200].map((n) => (
              <option key={n} value={n}>{n}행</option>
            ))}
          </select>
          <span style={{ fontSize: 'var(--grid-font-size)', color: 'var(--color-text-secondary)' }}>
            {t('grid.totalItems', { count: totalElements })}
          </span>
          {errorHistory.length > 0 && (
            <button
              onClick={() => setErrorPanelOpen(true)}
              style={{
                padding: '2px 8px',
                borderRadius: 4,
                backgroundColor: '#fef2f2',
                color: '#dc2626',
                border: '1px solid #fca5a5',
                cursor: 'pointer',
                fontSize: 'var(--grid-font-size, 12px)',
                fontWeight: 600,
              }}
            >
              메시지보기 ({errorHistory.length})
            </button>
          )}
        </div>
      </div>

      {showResetConfirm && (
        <div style={{
          position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
          background: 'rgba(0,0,0,0.4)', zIndex: 10000,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}>
          <div style={{
            background: '#fff', borderRadius: 8, padding: '24px 28px',
            boxShadow: '0 4px 24px rgba(0,0,0,0.18)', maxWidth: 400,
          }}>
            <p style={{ margin: '0 0 20px', fontSize: 'var(--font-size-md)', lineHeight: 1.6 }}>
              사용자가 지정한 그리드 설정이 삭제됩니다. 진행하시겠습니까?
            </p>
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8 }}>
              <button
                onClick={handleResetConfirm}
                className="mes-btn"
              >
                승인
              </button>
              <button
                ref={(el) => el?.focus()}
                onClick={() => setShowResetConfirm(false)}
                className="mes-btn mes-btn-save"
              >
                {t('common.cancel')}
              </button>
            </div>
          </div>
        </div>
      )}

      <Modal
        open={clipboardHelpOpen}
        onClose={() => setClipboardHelpOpen(false)}
        title={t('grid.clipboardHelp')}
        compact
        width={420}
      >
        <div style={{ fontSize: 'var(--font-size-base)', lineHeight: 1.8, color: '#1e293b' }}>
          <p style={{ fontWeight: 600, marginBottom: 8 }}>그리드에서 엑셀로 복사 사용법</p>
          <ol style={{ margin: 0, paddingLeft: 20, marginBottom: 16 }}>
            <li><strong>복사/붙이기 ON</strong> 버튼 클릭 (클립보드 모드 활성화)</li>
            <li>시작 셀 <strong>클릭</strong> → 앵커 지점 설정</li>
            <li>끝 셀 <strong>Shift+클릭</strong> → 사각형 범위가 파란색으로 하이라이트</li>
            <li><strong>Ctrl+C</strong> → 선택된 범위가 TSV(탭 구분) 형식으로 클립보드에 복사</li>
            <li>엑셀에서 <strong>Ctrl+V</strong> → 붙여넣기</li>
          </ol>
          <p style={{ fontWeight: 600, marginBottom: 8 }}>하단 소계 사용법</p>
          <ol style={{ margin: 0, paddingLeft: 20 }}>
            <li><strong>복사/붙이기 ON</strong> 버튼 클릭</li>
            <li>소계를 넣을 위치의 셀을 <strong>클릭</strong></li>
            <li><strong>하단 소계</strong> 버튼 클릭 → 클릭한 셀 아래에 소계 행 삽입</li>
            <li>클릭한 셀 기준 우측 숫자 컬럼의 합계가 자동 계산됩니다</li>
          </ol>
        </div>
      </Modal>
    </div>
  );
}
