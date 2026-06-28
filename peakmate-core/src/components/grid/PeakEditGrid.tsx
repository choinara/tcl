import { useRef, useMemo, useCallback, useState, useEffect, forwardRef, useImperativeHandle } from 'react';
import { AgGridReact } from 'ag-grid-react';
import type { ColDef, ColGroupDef, ColTypeDef, CellValueChangedEvent, CellKeyDownEvent, CellClickedEvent, ColumnResizedEvent, RowClassParams, IRowNode } from 'ag-grid-community';
import { AllCommunityModule, ModuleRegistry } from 'ag-grid-community';
import { useTranslation } from 'react-i18next';
import { usePreferenceStore } from '@/stores/usePreferenceStore';
import { Modal } from '../ui/Modal';
import { useConfirm } from '../ui/ConfirmDialog';
import { useGridFeatures } from '@/hooks/useGridFeatures';
import { exportToExcel } from './ExcelExport';
import { CheckboxFilter } from './CheckboxFilter';
import { ColumnSelector } from './ColumnSelector';
import { Search } from 'lucide-react';
import { coreNotify, useNotifyStore } from '@/stores/useNotifyStore';
import './agGridTheme.css';

ModuleRegistry.registerModules([AllCommunityModule]);

/** ColGroupDef 판별 */
function isColGroup(col: ColDef | ColGroupDef): col is ColGroupDef {
  return 'children' in col && Array.isArray((col as ColGroupDef).children);
}

/** ColGroupDef 트리에서 leaf ColDef만 추출 */
function flatLeafColumns(cols: (ColDef | ColGroupDef)[]): ColDef[] {
  const result: ColDef[] = [];
  for (const col of cols) {
    if (isColGroup(col)) {
      result.push(...flatLeafColumns(col.children));
    } else {
      result.push(col);
    }
  }
  return result;
}

/** localStorage 키 */
function colOrderKey(gridId: string): string {
  return `pm-col-order:${gridId}`;
}

/** 컬럼 field 배열로 간단한 해시 생성 */
function autoGridId(cols: ColDef[]): string {
  const key = cols.map((c) => c.field || c.colId || '').join(',');
  let h = 0;
  for (let i = 0; i < key.length; i++) {
    h = ((h << 5) - h + key.charCodeAt(i)) | 0;
  }
  return `auto-grid:${(h >>> 0).toString(36)}`;
}

let nextRowId = 1;
function generateRowId(): string {
  return `__new_${Date.now()}_${nextRowId++}`;
}

/**
 * RFC 4180 호환 TSV 파서
 * 엑셀이 셀 내부 줄바꿈을 따옴표로 감싸는 형식 처리:
 * "0.2*45\n(신규표면)"\t일반동\tDemand
 */
export function parseTsv(text: string): string[][] {
  const rows: string[][] = [];
  let row: string[] = [];
  let cell = '';
  let inQuote = false;
  const s = text.replace(/\r\n?/g, '\n').replace(/\n$/, '');

  for (let i = 0; i < s.length; i++) {
    const ch = s[i];
    if (inQuote) {
      if (ch === '"') {
        if (s[i + 1] === '"') {
          cell += '"';  // escaped quote
          i++;
        } else {
          inQuote = false;  // end of quoted field
        }
      } else {
        cell += ch;
      }
    } else {
      if (ch === '"' && cell === '') {
        inQuote = true;
      } else if (ch === '\t') {
        row.push(cell);
        cell = '';
      } else if (ch === '\n') {
        row.push(cell);
        cell = '';
        rows.push(row);
        row = [];
      } else {
        cell += ch;
      }
    }
  }
  // last cell/row
  row.push(cell);
  rows.push(row);
  return rows;
}

/** RBAC 권한 객체. 미전달 시 모든 동작 허용 (기존 동작 호환) */
interface PeakEditGridPermission {
  canCreate?: boolean;
  canUpdate?: boolean;
  canDelete?: boolean;
  canExport?: boolean;
}

interface PeakEditGridProps {
  columns: (ColDef | ColGroupDef)[];
  data: Record<string, unknown>[];
  gridId?: string;
  enableClipboard?: boolean;
  bodyHeight?: number | 'fitToParent';
  onBatchSave?: (rows: { _rowState: string; [key: string]: unknown }[]) => Promise<void>;
  /** 엑셀 파일명 (기본: 'export') */
  excelFileName?: string;
  /** 순번 컬럼 숨김 (시스템/기준정보 페이지용) */
  hideRowNumber?: boolean;
  /** 팝업입력 활성화 */
  enablePopupEdit?: boolean;
  /** 저장 버튼 라벨 (기본: grid.batchSave) */
  saveButtonLabel?: string;
  /** 항상 저장 버튼 활성화 (수정 행 없어도) */
  alwaysSaveable?: boolean;
  /** 툴바 우측 행추가 버튼 왼쪽에 삽입할 커스텀 버튼 */
  extraToolbarButtons?: React.ReactNode;
  /** 툴바 우측 행삭제 버튼과 저장 버튼 사이에 삽입할 커스텀 버튼 */
  extraToolbarButtonsAfterDelete?: React.ReactNode;
  /** 페이지당 행 수 (기본: 25) */
  pageSize?: number;
  /** 합계행을 하단 고정(pinned) 대신 데이터 마지막 행으로 표시 */
  inlineTotalRow?: boolean;
  /** 팝업입력 모달에서 검색 버튼을 표시할 필드 목록 */
  popupEditSearchFields?: string[];
  /** 팝업입력 모달에서 검색 버튼 클릭 시 호출 */
  onPopupFieldSearch?: (field: string, currentValue: string) => void;
  /** 합계행에 표시할 필드 목록 (미지정 시 모든 숫자 컬럼) */
  totalFields?: string[];
  /** 인라인 그리드에서 셀 클릭 시 검색 모달을 트리거할 필드 목록 */
  searchableGridFields?: string[];
  /** 인라인 그리드 셀 클릭 검색 콜백 (field, 절대 행 인덱스, 행 데이터) */
  onGridFieldSearch?: (field: string, rowIndex: number, data: Record<string, unknown>) => void;
  /** 툴바 저장 버튼 숨김 (외부에서 triggerSave를 사용할 때) */
  hideSave?: boolean;
  /** 툴바 좌측에 표시할 타이틀 */
  toolbarTitle?: React.ReactNode;
  /** 그리드 높이를 데이터 행 수에 맞게 자동 조절 (내부 스크롤 없음) */
  autoHeight?: boolean;
  /** 행추가/행삭제 버튼 숨김 (외부에서 직접 관리할 때) */
  hideRowButtons?: boolean;
  /** 붙여넣기 완료 후 콜백 (부모가 소계/합계 등 재계산할 수 있도록) */
  onPasteComplete?: () => void;
  /** 클립보드 모드 변경 시 콜백 */
  onClipboardModeChange?: (active: boolean) => void;
  /** 체크박스 행선택 컬럼 표시 (기본: false) */
  showCheckbox?: boolean;
  /** RBAC 권한. 미전달 시 모든 동작 허용 */
  permission?: PeakEditGridPermission;
  /** 행 클릭 콜백 (팝업편집 템플릿에서 행 선택 추적용) */
  onRowClick?: (data: Record<string, unknown>) => void;
  /** 합계행 강제 숨김 (글로벌 설정과 무관하게 이 그리드에서만 비활성) */
  hideTotalRow?: boolean;
  /** 행 스타일 콜백 (지연 행 적색 표시 등) */
  getRowStyle?: (params: RowClassParams) => Record<string, string> | undefined;
}

export interface PeakEditGridRef {
  appendRow: (row?: Record<string, unknown>) => void;
  getModifiedCount: () => number;
  deleteSelectedRows: () => void;
  resetColumnOrder: () => void;
  /** 현재 그리드에 표시된 순서(정렬/필터 적용)로 데이터 반환 */
  getDisplayedData: () => Record<string, unknown>[];
  /** 팝업입력 모달의 현재 행 데이터 업데이트 */
  updatePopupEditRow: (updates: Record<string, unknown>) => void;
  /** 외부에서 저장 트리거 */
  triggerSave: () => Promise<void>;
  /** 절대 행 인덱스로 특정 행 데이터 업데이트 */
  updateRowAt: (rowIndex: number, updates: Record<string, unknown>) => void;
  /** 클립보드 모드 활성 여부 */
  isClipboardMode: () => boolean;
  /** 현재 포커스된 셀 정보 반환 */
  getFocusedCell: () => { rowIndex: number; colId: string } | null;
  /** AG Grid 선택된 행 반환 */
  getSelectedRows: () => Record<string, unknown>[];
  /** 내부 allRowsRef 데이터 직접 반환 (소계/합계 포함) */
  getAllRows: () => Record<string, unknown>[];
  /** 그리드 리렌더링 트리거 */
  refreshView: () => void;
}

export const PeakEditGrid = forwardRef<PeakEditGridRef, PeakEditGridProps>(function PeakEditGrid(
  { columns, data, gridId: gridIdProp, enableClipboard = false, bodyHeight = 500, onBatchSave, excelFileName = 'export', hideRowNumber = false, enablePopupEdit = false, saveButtonLabel, alwaysSaveable = false, extraToolbarButtons, extraToolbarButtonsAfterDelete, pageSize, inlineTotalRow = false, popupEditSearchFields, onPopupFieldSearch, totalFields, searchableGridFields, onGridFieldSearch, hideSave = false, toolbarTitle, autoHeight = false, hideRowButtons = false, onPasteComplete, onClipboardModeChange, showCheckbox = false, permission, onRowClick, hideTotalRow = false, getRowStyle },
  ref,
) {
  const gridRef = useRef<AgGridReact>(null);
  const isResettingRef = useRef(false);
  const { t } = useTranslation();
  const prefStore = usePreferenceStore();
  const features = useGridFeatures();
  const errorHistory = useNotifyStore(s => s.errorHistory);
  const setErrorPanelOpen = useNotifyStore(s => s.setErrorPanelOpen);
  const { confirm: confirmDialog, ConfirmDialog } = useConfirm();

  // columns에서 ColGroupDef와 ColDef를 분리
  const flatCols = useMemo(() => columns.filter((c) => !isColGroup(c)) as ColDef[], [columns]);
  const groupCols = useMemo(() => columns.filter((c) => isColGroup(c)) as ColGroupDef[], [columns]);
  const leafCols = useMemo(() => flatLeafColumns(columns), [columns]);

  const gridId = useMemo(
    () => gridIdProp || autoGridId(leafCols),
    [gridIdProp, leafCols],
  );

  // ── 변경 추적 ──
  const createdRowsRef = useRef<Set<string>>(new Set());
  const updatedRowsRef = useRef<Set<string>>(new Set());
  const deletedRowsRef = useRef<Record<string, unknown>[]>([]);
  const [modifiedRows, setModifiedRows] = useState(0);
  const [saving, setSaving] = useState(false);

  // ── 팝업입력 모달 ──
  const [popupEditOpen, setPopupEditOpen] = useState(false);
  const [popupEditRow, setPopupEditRow] = useState<Record<string, unknown> | null>(null);

  // ── 클립보드 모드 (편집 비활성, 범위 복사/붙여넣기) ──
  const [clipboardMode, setClipboardMode] = useState(false);
  const [clipboardHelpOpen, setClipboardHelpOpen] = useState(false);

  // ── 사각형 범위 선택 (클립보드 모드 전용) ──
  const [rangeAnchor, setRangeAnchor] = useState<{ rowIndex: number; colIndex: number } | null>(null);
  const [rangeEnd, setRangeEnd] = useState<{ rowIndex: number; colIndex: number } | null>(null);

  // ── quickFilter 상태 ──
  const [quickFilterText, setQuickFilterText] = useState('');

  // ── 수동 페이징 (페이지당 행 수 + inline 합계) ──
  const [effectivePageSize, setEffectivePageSize] = useState<number>(() => {
    const saved = usePreferenceStore.getState().getGridPageSize();
    return saved ?? (pageSize ?? 25);
  });
  const allRowsRef = useRef<Record<string, unknown>[]>(
    data.map((row) => ({ ...row, __rowId: row.__rowId || row.id || generateRowId() })),
  );
  const [editPageIndex, setEditPageIndex] = useState(0);
  const [rowVersion, setRowVersion] = useState(0);

  const updateModifiedCount = useCallback(() => {
    const count = createdRowsRef.current.size + updatedRowsRef.current.size + deletedRowsRef.current.length;
    setModifiedRows(count);
  }, []);

  // 데이터 변경 시 초기화
  useEffect(() => {
    allRowsRef.current = data.map((row) => ({
      ...row,
      __rowId: row.__rowId || row.id || generateRowId(),
    }));
    setEditPageIndex(0);
    setRowVersion((v) => v + 1);
    createdRowsRef.current.clear();
    updatedRowsRef.current.clear();
    deletedRowsRef.current = [];
    setModifiedRows(0);
  }, [data]);

  const getRowId = useCallback((params: { data: Record<string, unknown> }) => {
    return String(params.data.__rowId);
  }, []);

  // ── 페이지 계산 ──
  const editTotalPages = Math.max(1, Math.ceil(allRowsRef.current.length / effectivePageSize));
  const totalRowCount = allRowsRef.current.length;

  // ── 컬럼 순서 (preferenceStore + localStorage 폴백) ──
  const defaultOrder = useMemo(
    () => flatCols.map((c) => c.field || c.colId || ''),
    [flatCols],
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

  // ── 컬럼 폭 (preferenceStore + localStorage 폴백) ──
  const [savedWidths, setSavedWidths] = useState<Record<string, number> | null>(() => {
    return prefStore.getColWidths(gridId);
  });
  const hasCustomWidthsRef = useRef(!!savedWidths);
  const [widthsCustomized, setWidthsCustomized] = useState(!!savedWidths);

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

  const isColumnOrderCustomized = useMemo(() => {
    if (defaultOrder.length !== columnOrder.length) return true;
    return defaultOrder.some((name, i) => name !== columnOrder[i]);
  }, [defaultOrder, columnOrder]);

  const isCustomized = isColumnOrderCustomized || widthsCustomized;

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
    setTimeout(() => {
      const api = gridRef.current?.api;
      if (!api) return;
      const allCols = leafCols.map((c) => c.field || c.colId || '').filter(Boolean);
      for (const colId of allCols) {
        api.setColumnsVisible([colId], !hidden.includes(colId));
      }
      api.sizeColumnsToFit();
    }, 0);
  }, [gridId, prefStore, leafCols]);

  // 컬럼 순서 적용 + 기본값 처리 + 저장된 폭 적용 + 기능 토글
  const orderedColumns = useMemo(() => {
    // flat columns만 내부 처리 (ColGroupDef는 pass-through)
    const processed = flatCols.map((col) => {
      const isNumber = col.type === 'numericColumn';
      const colId = col.field || col.colId || '';
      const isHidden = hiddenColumns.includes(colId);
      return {
        ...col,
        ...(isHidden ? { hide: true } : {}),
        editable: clipboardMode
          ? false
          : (permission?.canUpdate === false)
            ? false
            : (col.editable === false
              ? false
              : typeof col.editable === 'function'
                ? col.editable
                : (p: { data: Record<string, unknown> }) => !p.data?.__isTotal),
        // cellStyle: 숫자 컬럼 우측정렬, conditionalStyle 토글
        cellStyle: isNumber
          ? (features.conditionalStyle && !col.cellStyle
            ? (p: { value: unknown }) => {
                const num = Number(p.value);
                return { textAlign: 'right' as const, ...(num < 0 ? { color: '#dc2626' } : {}) };
              }
            : { textAlign: 'right' as const })
          : (col.cellStyle ?? { textAlign: 'center' as const }),
        // autoFormat 토글: 숫자 컬럼 천단위 포맷
        valueFormatter: isNumber
          ? (col.valueFormatter ?? (features.autoFormat
              ? ((p: { value: unknown }) => {
                  if (p.value == null || p.value === '') return '';
                  const num = Number(p.value);
                  if (isNaN(num)) return String(p.value);
                  return num.toLocaleString('ko-KR');
                })
              : undefined))
          : col.valueFormatter,
        // tooltip 토글
        ...(features.tooltip && !col.tooltipValueGetter ? {
          tooltipValueGetter: (p: { value: unknown }) => p.value != null ? String(p.value) : '',
        } : {}),
        // 저장된 폭
        ...(savedWidths?.[colId] ? { width: savedWidths[colId], flex: undefined } : {}),
      };
    });

    const colMap = new Map(processed.map((c) => [c.field || c.colId || '', c]));
    const result: (ColDef | ColGroupDef)[] = [];
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
    // ColGroupDef는 처리 없이 뒤에 추가 (pinned 컬럼은 AG Grid가 자동 배치)
    result.push(...groupCols);
    return result;
  }, [flatCols, groupCols, columnOrder, savedWidths, hiddenColumns, features, clipboardMode, permission?.canUpdate]);

  // ── 순번 컬럼 추가 ──
  const finalColumns = useMemo(() => {
    // valueGetter를 래핑: 합계행(__isTotal)이면 저장된 필드 값 직접 반환
    // ColGroupDef는 건너뛰기 (field/valueGetter 없음)
    const wrappedColumns = orderedColumns.map(col => {
      if (isColGroup(col)) return col;
      if (col.valueGetter && typeof col.valueGetter === 'function' && col.field) {
        const origGetter = col.valueGetter as (params: unknown) => unknown;
        return {
          ...col,
          valueGetter: (params: unknown) => {
            if ((params as { data?: Record<string, unknown> }).data?.__isTotal) {
              return (params as { data?: Record<string, unknown> }).data?.[col.field!];
            }
            return origGetter(params);
          },
        };
      }
      return col;
    });
    // rowNumber 토글: features.rowNumber && !hideRowNumber
    const result = (hideRowNumber || !features.rowNumber)
      ? wrappedColumns
      : [
          {
            colId: '__rowNum',
            headerName: 'No.',
            width: 55,
            maxWidth: 70,
            sortable: false,
            filter: false,
            suppressMovable: true,
            editable: false,
            cellStyle: { textAlign: 'center' },
            valueGetter: (params: { data?: Record<string, unknown>; node?: { rowIndex?: number } }) =>
              params.data?.__isTotal
                ? '' : (params.node ? editPageIndex * effectivePageSize + (params.node.rowIndex ?? 0) + 1 : ''),
          } as ColDef,
          ...wrappedColumns,
        ];

    if (showCheckbox) {
      const checkboxCol: ColDef = {
        colId: '__checkbox',
        headerName: '',
        checkboxSelection: true,
        headerCheckboxSelection: true,
        width: 40,
        maxWidth: 40,
        minWidth: 40,
        sortable: false,
        filter: false,
        resizable: false,
        suppressMovable: true,
        lockPosition: 'left',
        editable: false,
        cellStyle: { textAlign: 'center' },
      };
      return [checkboxCol, ...result];
    }

    return result;
  }, [orderedColumns, hideRowNumber, features.rowNumber, showCheckbox, editPageIndex, effectivePageSize]);

  // ── columnTypes: numericColumn 내장 타입 오버라이드 ──
  const columnTypes = useMemo<Record<string, ColTypeDef>>(() => ({
    numericColumn: {
      headerClass: 'ag-right-aligned-header',
      cellClass: 'ag-right-aligned-cell',
      filter: features.columnFilter ? CheckboxFilter : true,
    },
  }), [features.columnFilter]);

  const defaultColDef = useMemo<ColDef>(
    () => ({
      resizable: true,
      sortable: true,
      minWidth: 80,
      // filter: false 시 legacy 모드에서 ☰ 버튼이 사라지므로 true 폴백
      filter: features.columnFilter ? CheckboxFilter : true,
      // columnPinning 토글
      lockPinned: !features.columnPinning,
    }),
    [features.columnFilter, features.columnPinning],
  );

  // ── 현재 페이지 데이터 슬라이스 ──
  const currentPageRows = useMemo(() => {
    const start = editPageIndex * effectivePageSize;
    return allRowsRef.current.slice(start, start + effectivePageSize);
  }, [editPageIndex, rowVersion, effectivePageSize]);

  // ── 현재 페이지 inline 합계행 ──
  const pageTotalRow = useMemo(() => {
    if (hideTotalRow || features.totalRowType === 'off') return null;
    const numericCols = leafCols.filter((c) => c.type === 'numericColumn' && c.field);
    if (numericCols.length === 0) return null;

    // totalFields가 지정되면 해당 필드만 합산
    const targetCols = totalFields
      ? numericCols.filter((c) => totalFields.includes(c.field!))
      : numericCols;

    const totals: Record<string, unknown> = { __rowId: '__total', __isTotal: true };
    for (const c of leafCols) {
      if (c.field) totals[c.field] = '';
    }
    for (const col of targetCols) {
      const field = col.field!;
      let sum = 0;
      for (const row of currentPageRows) {
        // valueGetter가 있으면 computed 값 사용
        let val: number;
        if (col.valueGetter && typeof col.valueGetter === 'function') {
          val = Number((col.valueGetter as (p: unknown) => unknown)({ data: row }));
        } else {
          val = Number(row[field]);
        }
        if (!isNaN(val)) sum += val;
      }
      totals[field] = sum;
    }
    const firstTextField = leafCols.find((c) => c.type !== 'numericColumn' && c.field);
    if (firstTextField?.field) totals[firstTextField.field] = t('common.total');
    return totals;
  }, [features.totalRowType, leafCols, currentPageRows, totalFields, t]);

  // features.totalRowType: 'inline' → 데이터 마지막 행, 'pinned' → 하단 고정
  const effectiveRowData = useMemo(() => {
    if (features.totalRowType === 'inline' && pageTotalRow) {
      return [...currentPageRows, pageTotalRow];
    }
    return currentPageRows;
  }, [features.totalRowType, currentPageRows, pageTotalRow]);

  const pinnedBottomRowData = useMemo(() => {
    if (features.totalRowType !== 'pinned' || !pageTotalRow) return undefined;
    return [pageTotalRow];
  }, [features.totalRowType, pageTotalRow]);

  // ── postSortRows: inline 합계 행을 정렬 후에도 항상 맨 아래 유지 ──
  const postSortRows = useCallback((params: { nodes: IRowNode[] }) => {
    const nodes = params.nodes;
    for (let i = nodes.length - 1; i >= 0; i--) {
      if ((nodes[i].data as Record<string, unknown> | undefined)?.__isTotal) {
        nodes.push(nodes.splice(i, 1)[0]);
      }
    }
  }, []);

  // ── getRowClass: inline 합계 행 CSS 클래스 ──
  const getRowClass = useCallback((params: RowClassParams) => {
    if ((params.data as Record<string, unknown> | undefined)?.__isTotal) return 'ag-total-row';
    return undefined;
  }, []);

  // ── 합계 행 선택/편집 방지 ──
  const isRowSelectable = useCallback((params: { data: Record<string, unknown> }) => {
    return !params.data?.__isTotal;
  }, []);

  // ── Clipboard: Ctrl+C 복사 ──
  const handleClipboardCopy = useCallback(() => {
    const api = gridRef.current?.api;
    if (!api) return;

    const focusedCell = api.getFocusedCell();
    if (!focusedCell) return;

    // 편집 가능한 컬럼만 (순번 제외)
    const visibleCols = api.getAllDisplayedColumns()
      .filter((c) => c.getColId() !== '__rowNum');

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
        if (!node?.data || node.data.__isTotal) continue;
        rows.push(
          rangeCols.map((col) => {
            const field = col.getColDef().field;
            const val = field ? node.data[field] : '';
            return val != null ? String(val) : '';
          }).join('\t'),
        );
      }
      navigator.clipboard.writeText([header, ...rows].join('\n')).catch(() => {}); // 클립보드 권한 거부 시 복사 건너뜀
      return;
    }

    // 2) 체크박스 선택된 행이 있으면 다중 행 복사
    const selectedNodes = api.getSelectedNodes().filter(
      (n) => n.data && !n.data.__isTotal,
    );

    if (selectedNodes.length > 1) {
      const header = visibleCols.map((c) => c.getColDef().headerName ?? c.getColId()).join('\t');
      const rows = selectedNodes.map((node) =>
        visibleCols.map((col) => {
          const field = col.getColDef().field;
          const val = field ? node.data[field] : '';
          return val != null ? String(val) : '';
        }).join('\t'),
      );
      navigator.clipboard.writeText([header, ...rows].join('\n')).catch(() => {}); // 클립보드 권한 거부 시 복사 건너뜀
    } else {
      // 3) 포커스된 단일 셀 복사
      const node = api.getDisplayedRowAtIndex(focusedCell.rowIndex);
      if (!node?.data) return;
      const field = focusedCell.column.getColDef().field;
      const val = field ? node.data[field] : '';
      navigator.clipboard.writeText(val != null ? String(val) : '').catch(() => {}); // 클립보드 권한 거부 시 복사 건너뜀
    }
  }, [rangeAnchor, rangeEnd]);

  // ── Clipboard: Ctrl+V 붙여넣기 ──
  const handleClipboardPaste = useCallback((clipboardText: string) => {
    if (permission?.canUpdate === false) return;
    const api = gridRef.current?.api;
    if (!api) return;

    // 편집 중이면 붙여넣기를 브라우저 기본 동작에 위임
    if (api.getEditingCells().length > 0) return;

    const focusedCell = api.getFocusedCell();
    if (!focusedCell) return;

    // TSV 파싱 (엑셀 복사 형식: 탭 구분, 줄 바꿈, 따옴표 감싼 셀 지원)
    let tsvData = parseTsv(clipboardText);

    // 편집 가능 컬럼 목록 (순번 제외)
    const visibleCols = api.getAllDisplayedColumns()
      .filter((c) => c.getColId() !== '__rowNum');
    const startColIndex = visibleCols.findIndex(
      (c) => c.getColId() === focusedCell.column.getColId(),
    );
    if (startColIndex < 0) return;

    // 첫 행이 헤더(컬럼명)인지 감지 → 헤더면 건너뛰기
    if (tsvData.length > 1) {
      const headerNames = new Set(
        visibleCols.map((c) => (c.getColDef().headerName ?? c.getColId()).trim()),
      );
      const firstRowValues = tsvData[0].map((v) => v.trim());
      const matchCount = firstRowValues.filter((v) => headerNames.has(v)).length;
      if (matchCount >= 2 && matchCount >= firstRowValues.length * 0.4) {
        tsvData = tsvData.slice(1);
      }
    }

    // 절대 인덱스 계산 (페이지 오프셋 + 포커스 행)
    const absStart = editPageIndex * effectivePageSize + focusedCell.rowIndex;

    // 원본 컬럼 정의에서 editable 체크 — clipboardMode 오버라이드 제외
    const originalEditableInfo = new Map<string, ColDef['editable']>();
    leafCols.forEach((col) => {
      const id = col.field || col.colId || '';
      originalEditableInfo.set(id, col.editable);
    });

    // 편집 가능한 행만 카운트 (__isTotal, 소계 등 편집 불가 행 제외)
    // editable 함수를 가진 첫 번째 컬럼으로 행 편집 가능 여부 판단
    let writableCount = 0;
    let firstNonWritableIdx = -1;
    for (let i = absStart; i < allRowsRef.current.length; i++) {
      const rd = allRowsRef.current[i];
      if (rd.__isTotal) {
        if (firstNonWritableIdx < 0) firstNonWritableIdx = i;
        continue;
      }
      // editable 함수가 있는 컬럼 하나라도 true면 writable
      let isWritable = false;
      for (const [, origEd] of originalEditableInfo) {
        if (origEd === false) continue;
        if (typeof origEd === 'function') {
          if (origEd({ data: rd } as never)) { isWritable = true; break; }
        } else {
          isWritable = true; break;
        }
      }
      if (isWritable) {
        writableCount++;
      } else {
        if (firstNonWritableIdx < 0) firstNonWritableIdx = i;
      }
    }

    // 행 부족 시 자동으로 빈 행 추가 (allRowsRef 맨 뒤에 append)
    // 권한 검사는 함수 진입부에서 완료 (permission.canCreate는 행 추가 자동화에 동의된 것으로 간주)
    const rowsToAdd = tsvData.length - writableCount;
    if (rowsToAdd > 0) {
      const newRows: Record<string, unknown>[] = [];
      for (let i = 0; i < rowsToAdd; i++) {
        const newId = generateRowId();
        const emptyRow: Record<string, unknown> = { __rowId: newId };
        leafCols.forEach((col) => {
          if (col.field && !col.field.startsWith('__')) {
            const isBool = (col as Record<string, unknown>).cellDataType === 'boolean';
            emptyRow[col.field] = isBool ? false : '';
          }
        });
        newRows.push(emptyRow);
        createdRowsRef.current.add(newId);
      }
      allRowsRef.current = [...allRowsRef.current, ...newRows];
      coreNotify(`${rowsToAdd}개 행이 자동 추가되었습니다.`, { type: 'info' });
    }

    // 열 부족 검사 (열은 자동 증가 불가 — 그리드 컬럼 스키마 고정)
    const maxTsvCols = Math.max(...tsvData.map((r) => r.length));
    const availableCols = visibleCols.length - startColIndex;
    if (maxTsvCols > availableCols) {
      coreNotify(`열이 부족합니다. 복사 원본의 열을 줄이세요. (필요: ${maxTsvCols}열, 사용 가능: ${availableCols}열)`, { type: 'warning' });
      return;
    }

    let changed = false;
    let tsvIdx = 0;  // TSV 행 인덱스 (독립적으로 관리)

    for (let absIdx = absStart; absIdx < allRowsRef.current.length && tsvIdx < tsvData.length; absIdx++) {
      const rowData = allRowsRef.current[absIdx];
      // __isTotal 행은 건너뛰되 TSV 인덱스는 소비하지 않음
      if (rowData.__isTotal) continue;

      // 이 행에 실제로 쓰기 가능한 셀이 있는지 사전 확인
      // (소계 등 모든 셀이 editable:false인 행은 건너뜀)
      let rowWritable = false;
      for (let c = 0; c < tsvData[tsvIdx].length; c++) {
        const colIndex = startColIndex + c;
        if (colIndex >= visibleCols.length) break;
        const colId = visibleCols[colIndex].getColId();
        const origEditable = originalEditableInfo.get(colId);
        if (origEditable === false) continue;
        if (typeof origEditable === 'function') {
          if (!origEditable({ data: rowData } as never)) continue;
        }
        rowWritable = true;
        break;
      }
      if (!rowWritable) continue;  // TSV 인덱스 소비하지 않고 건너뜀

      for (let c = 0; c < tsvData[tsvIdx].length; c++) {
        const colIndex = startColIndex + c;
        if (colIndex >= visibleCols.length) break;
        const col = visibleCols[colIndex];
        const colDef = col.getColDef();
        const colId = col.getColId();
        // 원본 컬럼 기준 읽기전용 체크 — clipboardMode 설정과 무관하게 적용
        const origEditable = originalEditableInfo.get(colId);
        if (origEditable === false) continue;
        // editable 함수가 있으면 행 데이터로 평가
        if (typeof origEditable === 'function') {
          const canEdit = origEditable({ data: rowData } as never);
          if (!canEdit) continue;
        }
        const field = colDef.field;
        if (!field) continue;

        let newValue: unknown = tsvData[tsvIdx][c];
        const isNumCol = colDef.type === 'numericColumn' || (colDef as Record<string, unknown>).cellDataType === 'number';

        if (isNumCol) {
          // 숫자 컬럼: 숫자로 변환 (빈 값이나 변환 불가 텍스트는 null)
          const raw = String(newValue).trim();
          if (raw === '' || raw === '-') {
            newValue = null;
          } else {
            const cleaned = raw.replace(/,/g, '');
            const num = Number(cleaned);
            newValue = isNaN(num) ? null : num;
          }
        } else {
          // 텍스트 컬럼: 줄바꿈을 제거하여 한 줄로 합침
          const text = String(newValue ?? '');
          newValue = text.replace(/[\r\n]+/g, '').trim();
        }

        rowData[field] = newValue;
        changed = true;
      }

      // 변경 추적
      const rowId = String(rowData.__rowId);
      if (!createdRowsRef.current.has(rowId)) {
        updatedRowsRef.current.add(rowId);
      }
      tsvIdx++;  // 실제로 쓴 경우에만 다음 TSV 행으로
    }

    if (changed) {
      // 마지막 붙여넣기 행의 페이지로 자동 이동
      const lastAbsIdx = absStart + tsvData.length - 1;
      const targetPage = Math.floor(lastAbsIdx / effectivePageSize);
      setEditPageIndex(targetPage);
      updateModifiedCount();
      setRowVersion((v) => v + 1);
      // 붙여넣기 후 그리드 셀 강제 갱신
      api.refreshCells({ force: true });
      // 부모에게 붙여넣기 완료 알림 (소계/합계 재계산용)
      onPasteComplete?.();
    }
  }, [updateModifiedCount, editPageIndex, effectivePageSize, leafCols, onPasteComplete]);

  // ── 셀 클릭 핸들러 (클립보드 범위 선택 + 검색 필드 트리거) ──
  const onCellClickedForRange = useCallback((e: CellClickedEvent) => {
    // 검색 가능 필드 클릭 시 콜백
    if (searchableGridFields && onGridFieldSearch && !clipboardMode) {
      const field = e.column.getColDef().field;
      if (field && searchableGridFields.includes(field)) {
        const absIndex = editPageIndex * effectivePageSize + (e.rowIndex ?? 0);
        onGridFieldSearch(field, absIndex, e.data as Record<string, unknown>);
        return;
      }
    }
    if (!clipboardMode) return;
    const api = gridRef.current?.api;
    if (!api) return;
    const visibleCols = api.getAllDisplayedColumns().filter((c) => c.getColId() !== '__rowNum');
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
  }, [clipboardMode, rangeAnchor, searchableGridFields, onGridFieldSearch, editPageIndex, effectivePageSize]);

  // ── 범위 해제: 클립보드 모드 끄면 범위 초기화 ──
  useEffect(() => {
    if (!clipboardMode) {
      setRangeAnchor(null);
      setRangeEnd(null);
    }
  }, [clipboardMode]);

  // ── 범위 하이라이트 (DOM 기반) ──
  useEffect(() => {
    const wrapper = gridWrapperRef.current;
    if (!wrapper) return;
    const cls = 'ag-cell-range-selected';
    // 기존 하이라이트 제거
    wrapper.querySelectorAll(`.${cls}`).forEach((el) => el.classList.remove(cls));

    if (!rangeAnchor || !rangeEnd) return;
    const api = gridRef.current?.api;
    if (!api) return;

    const visibleCols = api.getAllDisplayedColumns().filter((c) => c.getColId() !== '__rowNum');
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

  // ── Space/F2 키로 편집모드 진입 (Enter는 탐색 전용) ──
  const onCellKeyDown = useCallback((e: CellKeyDownEvent) => {
    const event = e.event as KeyboardEvent | undefined;
    if (!event || !e.column || !e.node) return;

    // Ctrl+C: 클립보드 복사
    if (enableClipboard && (event.ctrlKey || event.metaKey) && event.key === 'c') {
      event.preventDefault();
      handleClipboardCopy();
      return;
    }

    if (event.key !== ' ' && event.key !== 'F2') return;
    // clipboardMode ON이면 Space/F2 편집 진입 차단
    if (clipboardMode) { event.preventDefault(); return; }
    const colDef = e.column.getColDef();
    // editable이 아닌 컬럼은 편집 시작 안 함
    if (colDef.editable === false) return;
    // 이미 편집 중이면 중복 편집 방지
    if (gridRef.current?.api?.getEditingCells().length) return;
    event.preventDefault();
    gridRef.current?.api?.startEditingCell({
      rowIndex: e.node.rowIndex!,
      colKey: e.column.getColId(),
    });
  }, [enableClipboard, handleClipboardCopy, clipboardMode]);

  // ── 셀 값 변경 ──
  const onCellValueChanged = useCallback(
    (e: CellValueChangedEvent) => {
      const rowId = String(e.data.__rowId);
      if (rowId === '__total') return;
      // allRowsRef 동기화
      const idx = allRowsRef.current.findIndex((r) => String(r.__rowId) === rowId);
      if (idx >= 0) {
        allRowsRef.current[idx] = { ...e.data };
      }
      if (!createdRowsRef.current.has(rowId)) {
        updatedRowsRef.current.add(rowId);
      }
      updateModifiedCount();
      setRowVersion((v) => v + 1);
    },
    [updateModifiedCount],
  );

  // ── 컬럼 이동 ──
  const onColumnMoved = useCallback(() => {
    if (isResettingRef.current) return;
    const api = gridRef.current?.api;
    if (!api) return;
    const colState = api.getColumnState();
    const newOrder = colState
      .map((c) => c.colId)
      .filter((id) => id !== '__rowNum');
    setColumnOrder(newOrder);
    prefStore.setColOrder(gridId, newOrder);
    // 현재 실제 폭을 savedWidths에 반영하여 orderedColumns 재계산 시 유지
    const widths: Record<string, number> = {};
    colState.forEach((cs) => {
      if (cs.colId !== '__rowNum') {
        widths[cs.colId] = cs.width;
      }
    });
    setSavedWidths(widths);
    prefStore.setColWidths(gridId, widths);
    // 리렌더 후 pixel 반올림 간격 제거
    setTimeout(() => api.sizeColumnsToFit(), 0);
  }, [gridId, prefStore]);

  // ── 컬럼 폭 변경 ──
  const onColumnResized = useCallback((e: ColumnResizedEvent) => {
    if (!e.finished || e.source === 'sizeColumnsToFit') return;
    const api = gridRef.current?.api;
    if (!api) return;
    const widths: Record<string, number> = {};
    api.getColumnState().forEach((cs) => {
      if (cs.colId !== '__rowNum') {
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
    const total = allRowsRef.current.length;
    if (total > 5000) {
      coreNotify(`다운로드 제한 리스트는 5,000건 입니다. 현재 ${total.toLocaleString()}건 이기 때문에 필터 조건을 좁혀주세요`, { type: 'warning' });
      return;
    }
    exportToExcel({ api, columnDefs: leafCols, fileName: excelFileName, rows: allRowsRef.current });
  }, [leafCols, excelFileName]);

  // ── CSV 내보내기 ──
  const handleCsvExport = useCallback(() => {
    const api = gridRef.current?.api;
    if (!api) return;
    api.exportDataAsCsv({ fileName: `${excelFileName}.csv` });
  }, [excelFileName]);

  // ── 행 추가 ──
  const handleAddRow = useCallback((row?: Record<string, unknown>) => {
    const newId = generateRowId();
    const newRow = { ...(row ?? {}), __rowId: newId };
    allRowsRef.current = [...allRowsRef.current, newRow];
    createdRowsRef.current.add(newId);
    updateModifiedCount();
    // 마지막 페이지로 자동 이동
    const lastPage = Math.max(0, Math.ceil(allRowsRef.current.length / effectivePageSize) - 1);
    setEditPageIndex(lastPage);
    setRowVersion((v) => v + 1);
  }, [updateModifiedCount, effectivePageSize]);

  // ── 행 삭제 ──
  const handleDeleteRow = useCallback(() => {
    const api = gridRef.current?.api;
    if (!api) return;
    const selected = api.getSelectedRows() as Record<string, unknown>[];
    if (selected.length === 0) return;

    const selectedIds = new Set(selected.map((r) => String(r.__rowId)));
    selected.forEach((row) => {
      const rowId = String(row.__rowId);
      if (createdRowsRef.current.has(rowId)) {
        createdRowsRef.current.delete(rowId);
      } else {
        updatedRowsRef.current.delete(rowId);
        deletedRowsRef.current.push(row);
      }
    });

    allRowsRef.current = allRowsRef.current.filter((r) => !selectedIds.has(String(r.__rowId)));
    // 현재 페이지가 범위를 초과하면 조정
    const maxPage = Math.max(0, Math.ceil(allRowsRef.current.length / effectivePageSize) - 1);
    setEditPageIndex((prev) => Math.min(prev, maxPage));
    updateModifiedCount();
    setRowVersion((v) => v + 1);
  }, [updateModifiedCount, effectivePageSize]);

  // ── 일괄 저장 ──
  const handleBatchSave = useCallback(async () => {
    if (!onBatchSave) return;

    const payload: { _rowState: string; [key: string]: unknown }[] = [];

    for (const row of allRowsRef.current) {
      const rowId = String(row.__rowId);
      const rowDataItem = { ...row };
      delete rowDataItem.__rowId;
      delete rowDataItem.__isTotal;

      if (createdRowsRef.current.has(rowId)) {
        payload.push({ ...rowDataItem, _rowState: 'created' });
      } else if (updatedRowsRef.current.has(rowId)) {
        payload.push({ ...rowDataItem, _rowState: 'updated' });
      }
    }

    deletedRowsRef.current.forEach((row) => {
      const rowDataItem = { ...row };
      delete rowDataItem.__rowId;
      payload.push({ ...rowDataItem, _rowState: 'deleted' });
    });

    if (payload.length === 0 && !alwaysSaveable) return;

    setSaving(true);
    try {
      await onBatchSave(payload);
      createdRowsRef.current.clear();
      updatedRowsRef.current.clear();
      deletedRowsRef.current = [];
      setModifiedRows(0);
    } finally {
      setSaving(false);
    }
  }, [onBatchSave, alwaysSaveable]);

  // ── 팝업입력 열기 (신규 행 생성 전용) ──
  const handlePopupEdit = useCallback(() => {
    const newId = generateRowId();
    const emptyRow: Record<string, unknown> = { __rowId: newId };
    leafCols.forEach((col) => {
      if (col.field && col.field !== '__rowId' && col.field !== '__isTotal') {
        const isBool = (col as Record<string, unknown>).cellDataType === 'boolean';
        emptyRow[col.field] = isBool ? false : '';
      }
    });
    setPopupEditRow(emptyRow);
    setPopupEditOpen(true);
  }, [leafCols]);

  // ── 팝업입력 저장 (신규 행 추가) ──
  const handlePopupSave = useCallback((newRow: Record<string, unknown>) => {
    const rowId = String(newRow.__rowId);
    allRowsRef.current = [...allRowsRef.current, newRow];
    createdRowsRef.current.add(rowId);
    updateModifiedCount();
    const lastPage = Math.max(0, Math.ceil(allRowsRef.current.length / effectivePageSize) - 1);
    setEditPageIndex(lastPage);
    setRowVersion((v) => v + 1);
    setPopupEditOpen(false);
    setPopupEditRow(null);
  }, [updateModifiedCount, effectivePageSize]);

  // ── 페이지당 행 수 변경 (개인화 저장) ──
  const handlePageSizeChange = useCallback((size: number) => {
    setEffectivePageSize(size);
    setEditPageIndex(0);
    setRowVersion((v) => v + 1);
    usePreferenceStore.getState().setGridPageSize(size);
  }, []);

  // ── 컬럼 순서/폭 초기화 ──

  const executeResetColumnOrder = useCallback(() => {
    // Prevent onColumnMoved from re-saving during reset
    isResettingRef.current = true;
    // 1. Clear React state
    setColumnOrder(defaultOrder);
    setSavedWidths(null);
    setHiddenColumns([]);
    hasCustomWidthsRef.current = false;
    setWidthsCustomized(false);
    // 2. Clear preferences
    prefStore.removeColOrder(gridId);
    prefStore.removeColWidths(gridId);
    prefStore.removeColHidden(gridId);
    try { localStorage.removeItem(colOrderKey(gridId)); } catch { /* 컬럼 순서 초기화 실패 — 다음 저장 시 덮어쓰기 */ }
    // 3. Force AG Grid to reset column state
    const api = gridRef.current?.api;
    if (api) {
      // __checkbox, __rowNum을 먼저 배치한 뒤 사용자 컬럼 순서 적용
      const prefix: { colId: string; pinned: string | null }[] = [];
      if (showCheckbox) prefix.push({ colId: '__checkbox', pinned: 'left' });
      if (!hideRowNumber && features.rowNumber) prefix.push({ colId: '__rowNum', pinned: null });
      const defaultState = [
        ...prefix,
        ...defaultOrder.filter(Boolean).map((colId) => ({ colId, pinned: null as string | null })),
      ];
      api.applyColumnState({ state: defaultState, applyOrder: true });
      setTimeout(() => {
        api.sizeColumnsToFit();
        isResettingRef.current = false;
      }, 0);
    } else {
      isResettingRef.current = false;
    }
  }, [defaultOrder, gridId, prefStore, hideRowNumber, features.rowNumber, showCheckbox]);

  const handleResetColumnOrder = useCallback(async () => {
    if (!await confirmDialog('사용자가 지정한 그리드 설정이 삭제됩니다. 진행하시겠습니까?')) return;
    executeResetColumnOrder();
  }, [confirmDialog, executeResetColumnOrder]);

  const handleFitColumns = useCallback(() => {
    const api = gridRef.current?.api;
    if (!api) return;
    api.sizeColumnsToFit();
    // 균등분할 결과를 저장
    setTimeout(() => {
      const widths: Record<string, number> = {};
      api.getColumnState().forEach((cs) => {
        if (cs.colId !== '__rowNum') {
          widths[cs.colId] = cs.width;
        }
      });
      hasCustomWidthsRef.current = true;
      if (!widthsCustomized) setWidthsCustomized(true);
      prefStore.setColWidths(gridId, widths);
    }, 0);
  }, [gridId, prefStore, widthsCustomized]);

  const handleAutoSizeColumns = useCallback(() => {
    const api = gridRef.current?.api;
    if (!api) return;
    api.autoSizeAllColumns();
    setTimeout(() => {
      const widths: Record<string, number> = {};
      api.getColumnState().forEach((cs) => {
        if (cs.colId !== '__rowNum') {
          widths[cs.colId] = cs.width;
        }
      });
      hasCustomWidthsRef.current = true;
      if (!widthsCustomized) setWidthsCustomized(true);
      prefStore.setColWidths(gridId, widths);
    }, 0);
  }, [gridId, prefStore, widthsCustomized]);

  // ── Ref API ──
  useImperativeHandle(ref, () => ({
    appendRow: handleAddRow,
    getModifiedCount: () => modifiedRows,
    deleteSelectedRows: handleDeleteRow,
    resetColumnOrder: executeResetColumnOrder,
    getDisplayedData: () => {
      const api = gridRef.current?.api;
      if (!api) return allRowsRef.current;
      const displayed: Record<string, unknown>[] = [];
      api.forEachNodeAfterFilterAndSort((node) => {
        if (node.data && !node.data.__isTotal) displayed.push(node.data);
      });
      return displayed.length > 0 ? displayed : allRowsRef.current;
    },
    updatePopupEditRow: (updates: Record<string, unknown>) => {
      setPopupEditRow((prev) => prev ? { ...prev, ...updates } : prev);
    },
    triggerSave: handleBatchSave,
    updateRowAt: (rowIndex: number, updates: Record<string, unknown>) => {
      if (rowIndex < 0 || rowIndex >= allRowsRef.current.length) return;
      const newRow = { ...allRowsRef.current[rowIndex], ...updates };
      if (!newRow.__origId) newRow._modified = true;
      allRowsRef.current[rowIndex] = newRow;
      updateModifiedCount();
      setRowVersion((v) => v + 1);
    },
    isClipboardMode: () => clipboardMode,
    getFocusedCell: () => {
      const api = gridRef.current?.api;
      if (!api) return null;
      const cell = api.getFocusedCell();
      if (!cell) return null;
      return { rowIndex: cell.rowIndex, colId: cell.column.getColId() };
    },
    getSelectedRows: () => {
      const api = gridRef.current?.api;
      if (!api) return [];
      return api.getSelectedRows() as Record<string, unknown>[];
    },
    getAllRows: () => allRowsRef.current,
    refreshView: () => setRowVersion((v) => v + 1),
  }));

  // ── 하단 소계: 클립보드 모드에서 포커스 셀 아래에 소계 행 삽입 ──
  const handleBottomSubtotal = useCallback(() => {
    const api = gridRef.current?.api;
    if (!api) return;
    const focusedCell = api.getFocusedCell();
    if (!focusedCell) { coreNotify('소계를 삽입할 셀을 먼저 클릭하세요.', { type: 'info' }); return; }

    const targetRowIdx = focusedCell.rowIndex;
    const allRows = allRowsRef.current;
    const targetRow = allRows[targetRowIdx];
    if (!targetRow || targetRow.__isTotal || targetRow.rowKind === 'grandTotal') return;
    if (targetRow.rowKind !== 'data') return;

    // 숫자 데이터 필드 목록 (순번·__rowId 등 제외)
    const numFields = leafCols
      .map((c) => c.field)
      .filter((f): f is string => !!f && !f.startsWith('__'));

    const focusedField = focusedCell.column.getColId();
    const startIdx = Math.max(0, numFields.indexOf(focusedField));

    // 소계 행 생성
    const subtotalId = `manual-st-${Date.now()}`;
    const subtotalRow: Record<string, unknown> = {
      __rowId: subtotalId,
      id: subtotalId,
      rowKind: 'subtotal',
    };

    // 원본 행의 그룹 키 복사 (lineCode, _lineCode, _polarityCode 등)
    for (const key of Object.keys(targetRow)) {
      if (key.startsWith('_') && !key.startsWith('__')) {
        subtotalRow[key] = targetRow[key];
      }
    }

    // 고정 텍스트 필드 초기화
    for (const col of leafCols) {
      if (col.field && col.editable === false && col.cellDataType !== 'number' && !col.field.startsWith('__')) {
        subtotalRow[col.field] = '';
      }
    }

    // 포커스 열 이전 필드는 null
    for (let i = 0; i < startIdx; i++) {
      subtotalRow[numFields[i]] = null;
    }

    // "소계" 라벨: 마지막 고정 텍스트 필드에 삽입
    const textFields = leafCols
      .filter((c) => c.field && c.editable === false && c.cellDataType !== 'number' && !c.field.startsWith('__'))
      .map((c) => c.field!);
    const labelField = textFields.length > 0 ? textFields[textFields.length - 1] : null;
    if (labelField) subtotalRow[labelField] = '소계';

    // 삽입
    allRows.splice(targetRowIdx + 1, 0, subtotalRow);

    // 소계 재계산: 삽입 위치 이후 소계 행들
    for (let i = targetRowIdx + 1; i < allRows.length; i++) {
      const row = allRows[i];
      if (row.__isTotal || row.rowKind === 'grandTotal') break;
      if (row.rowKind !== 'subtotal') continue;

      // 이 소계의 범위 시작: 위로 올라가며 이전 소계/합계 찾기
      let rangeStart = 0;
      for (let j = i - 1; j >= 0; j--) {
        const prev = allRows[j];
        if (prev.rowKind === 'subtotal' || prev.__isTotal || prev.rowKind === 'grandTotal') {
          rangeStart = j + 1;
          break;
        }
      }

      for (let fi = startIdx; fi < numFields.length; fi++) {
        const field = numFields[fi];
        let sum = 0;
        let hasValue = false;
        for (let j = rangeStart; j < i; j++) {
          const dr = allRows[j];
          if (dr.rowKind !== 'data') continue;
          const val = dr[field];
          if (val != null && typeof val === 'number') {
            sum += val;
            hasValue = true;
          }
        }
        (row as Record<string, unknown>)[field] = hasValue ? sum : null;
      }
    }

    setRowVersion((v) => v + 1);
  }, [leafCols]);

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
      if (!colId || colId === '__rowNum') return;
      e.preventDefault();
      e.stopPropagation();
      setPinMenu({ x: e.clientX, y: e.clientY, colId });
    };
    wrapper.addEventListener('contextmenu', onCtx);
    return () => wrapper.removeEventListener('contextmenu', onCtx);
  }, [features.columnPinning]);

  // ── Clipboard: paste 이벤트 리스너 (Ctrl+V) ──
  useEffect(() => {
    if (!enableClipboard) return;
    const wrapper = gridWrapperRef.current;
    if (!wrapper) return;
    const onPaste = (e: ClipboardEvent) => {
      // 편집 중이면 브라우저 기본 동작에 맡김
      if (gridRef.current?.api?.getEditingCells().length) return;
      const text = e.clipboardData?.getData('text/plain');
      if (!text) return;
      e.preventDefault();
      handleClipboardPaste(text);
    };
    wrapper.addEventListener('paste', onPaste);
    return () => wrapper.removeEventListener('paste', onPaste);
  }, [enableClipboard, handleClipboardPaste]);

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

  const isFitToParent = bodyHeight === 'fitToParent';

  // 사이즈 맞춤 (저장된 폭이 없을 때만)
  const onFirstDataRendered = useCallback(() => {
    if (!hasCustomWidthsRef.current) gridRef.current?.api?.sizeColumnsToFit();
  }, []);

  useEffect(() => {
    const handleResize = () => {
      if (!hasCustomWidthsRef.current) gridRef.current?.api?.sizeColumnsToFit();
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);


  return (
    <div style={isFitToParent ? { display: 'flex', flexDirection: 'column', flex: 1, minHeight: 0 } : undefined}>
      <div className="grid-toolbar">
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap', minWidth: 0 }}>
          {toolbarTitle}
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
        <div style={{ display: 'flex', gap: 4, alignItems: 'center' }}>
          {extraToolbarButtons}
          {!hideRowButtons && permission?.canCreate !== false && (
            <button
              onClick={() => handleAddRow()}
              className="mes-btn"
            >
              {t('grid.addRow')}
            </button>
          )}
          {!hideRowButtons && permission?.canDelete !== false && (
            <button
              onClick={handleDeleteRow}
              className="mes-btn mes-btn-delete"
            >
              {t('grid.deleteRow')}
            </button>
          )}
          {extraToolbarButtonsAfterDelete}
          {enablePopupEdit && permission?.canCreate !== false && (
            <button
              onClick={handlePopupEdit}
              className="mes-btn mes-btn-new"
            >
              {t('grid.popupEdit')}
            </button>
          )}
          {onBatchSave && !hideSave && permission?.canUpdate !== false && (
            <button
              onClick={handleBatchSave}
              disabled={(alwaysSaveable ? false : modifiedRows === 0) || saving}
              className="mes-btn mes-btn-save"
            >
              {saving ? t('common.saving') : (saveButtonLabel || t('grid.batchSave'))}
            </button>
          )}
        </div>
      </div>

      <div
        ref={gridWrapperRef}
        className={`ag-theme-mes${clipboardMode ? ' clipboard-mode' : ''}`}
        style={autoHeight ? { position: 'relative', width: '100%' } : isFitToParent ? { flex: 1, minHeight: 0, position: 'relative' } : { height: bodyHeight, position: 'relative' }}
        aria-label={t('grid.editGrid', '편집 그리드')}
      >
        <AgGridReact
          ref={gridRef}
          rowData={effectiveRowData}
          pinnedBottomRowData={pinnedBottomRowData}
          columnDefs={finalColumns}
          defaultColDef={defaultColDef}
          columnTypes={columnTypes}
          getRowId={getRowId}
          rowSelection="multiple"
          isRowSelectable={isRowSelectable}
          onCellValueChanged={onCellValueChanged}
          onCellClicked={onCellClickedForRange}
          onRowClicked={onRowClick ? (e) => { if (e.data) onRowClick(e.data as Record<string, unknown>); } : undefined}
          onCellKeyDown={onCellKeyDown}
          onColumnMoved={onColumnMoved}
          onColumnResized={onColumnResized}
          onFirstDataRendered={onFirstDataRendered}
          singleClickEdit={!clipboardMode}
          stopEditingWhenCellsLoseFocus={true}
          enableCellTextSelection={features.textSelection || enableClipboard}
          ensureDomOrder={features.textSelection}
          domLayout={autoHeight ? 'autoHeight' : 'normal'}
          overlayNoRowsTemplate={`<span>${t('common.noData')}</span>`}
          animateRows={features.animation}
          enableCellSpan={true}
          enableBrowserTooltips={features.tooltip}
          getRowClass={getRowClass}
          getRowStyle={getRowStyle}
          postSortRows={features.totalRowType === 'inline' ? postSortRows : undefined}
          quickFilterText={features.quickFilter ? quickFilterText : undefined}
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
            columns={leafCols}
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
          {enableClipboard && (
            <>
              <button
                onClick={() => setClipboardMode((v) => { const next = !v; onClipboardModeChange?.(next); return next; })}
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
            </>
          )}
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
          <button
            onClick={() => setEditPageIndex(0)}
            disabled={editPageIndex === 0}
            title="첫 페이지"
          >
            «
          </button>
          <button
            onClick={() => setEditPageIndex((p) => Math.max(0, p - 1))}
            disabled={editPageIndex === 0}
          >
            {t('grid.prev')}
          </button>
          <input
            type="number"
            min={1}
            max={editTotalPages}
            value={editPageIndex + 1}
            onChange={(e) => {
              const v = parseInt(e.target.value, 10);
              if (!isNaN(v) && v >= 1 && v <= editTotalPages) setEditPageIndex(v - 1);
            }}
            onKeyDown={(e) => { if (e.key === 'Enter') e.currentTarget.blur(); }}
            style={{
              width: 42, textAlign: 'center', padding: '0 4px',
              border: '1px solid var(--color-border)', borderRadius: 4,
              height: 26, fontSize: 'var(--font-size-sm)',
            }}
          />
          <span style={{ fontSize: 'var(--font-size-sm)', color: 'var(--color-text-secondary)' }}>
            / {editTotalPages}
          </span>
          <button
            onClick={() => setEditPageIndex((p) => Math.min(editTotalPages - 1, p + 1))}
            disabled={editPageIndex >= editTotalPages - 1}
          >
            {t('grid.next')}
          </button>
          <button
            onClick={() => setEditPageIndex(editTotalPages - 1)}
            disabled={editPageIndex >= editTotalPages - 1}
            title="마지막 페이지"
          >
            »
          </button>
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
          <span style={{
            fontSize: 'var(--grid-font-size)',
            color: modifiedRows > 0 ? 'var(--color-warning)' : 'var(--color-text-secondary)',
            fontWeight: modifiedRows > 0 ? 600 : 400,
          }}>
            {t('grid.modifiedCount', { count: modifiedRows })}
          </span>
          <span style={{ fontSize: 'var(--grid-font-size)', color: 'var(--color-text-secondary)' }}>
            {t('grid.totalItems', { count: totalRowCount })}
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

      <ConfirmDialog />

      {/* 팝업입력 모달 (공통 Modal 사용) */}
      <Modal
        open={popupEditOpen}
        onClose={() => { setPopupEditOpen(false); setPopupEditRow(null); }}
        title={t('grid.popupEdit')}
        wide
      >
        {popupEditRow && (
          <>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '12px 16px', marginBottom: 16 }}>
              {leafCols
                .filter((col) => col.field && col.field !== '__rowId' && col.field !== '__isTotal')
                .map((col) => {
                  const field = col.field!;
                  const hasValueGetter = col.valueGetter && typeof col.valueGetter === 'function';
                  const isReadOnly = col.editable === false;
                  const isNumeric = col.type === 'numericColumn';
                  const isBool = (col as Record<string, unknown>).cellDataType === 'boolean';
                  const hasSearch = popupEditSearchFields?.includes(field) && onPopupFieldSearch;
                  // valueGetter 컬럼은 실시간 계산값 표시
                  const value = hasValueGetter
                    ? (col.valueGetter as (p: unknown) => unknown)({ data: popupEditRow })
                    : popupEditRow[field];
                  return (
                    <div key={field}>
                      <label style={{ display: 'block', fontSize: 'var(--font-size-base)', color: '#64748b', marginBottom: 3, fontWeight: 500 }}>
                        {col.headerName || field}
                      </label>
                      {isBool ? (
                        <input
                          type="checkbox"
                          checked={!!value}
                          disabled={isReadOnly}
                          onChange={(e) => setPopupEditRow((prev) => prev ? { ...prev, [field]: e.target.checked } : prev)}
                          style={{ width: 18, height: 18 }}
                        />
                      ) : (
                        <div style={{ display: 'flex', gap: 2 }}>
                          <input
                            type={isNumeric ? 'number' : 'text'}
                            value={value != null ? String(value) : ''}
                            readOnly={isReadOnly}
                            onChange={(e) => {
                              const v = isNumeric ? (e.target.value === '' ? '' : Number(e.target.value)) : e.target.value;
                              setPopupEditRow((prev) => prev ? { ...prev, [field]: v } : prev);
                            }}
                            onKeyDown={hasSearch ? (e) => {
                              if (e.key === 'Enter') onPopupFieldSearch(field, value != null ? String(value) : '');
                            } : undefined}
                            style={{
                              flex: 1, height: 32, padding: '0 8px', fontSize: 'var(--font-size-md)',
                              border: '1px solid #d1d5db', borderRadius: 6, boxSizing: 'border-box',
                              backgroundColor: isReadOnly ? '#f1f5f9' : '#fff',
                              color: isReadOnly ? '#64748b' : '#1e293b',
                              textAlign: isNumeric ? 'right' : 'left',
                            }}
                          />
                          {hasSearch && (
                            <button
                              type="button"
                              onClick={() => onPopupFieldSearch(field, value != null ? String(value) : '')}
                              style={{
                                padding: '2px 6px', border: '1px solid #d1d5db', borderRadius: 6,
                                background: '#f8fafc', cursor: 'pointer', display: 'flex', alignItems: 'center',
                                flexShrink: 0, height: 32,
                              }}
                              title={t('common.search')}
                            >
                              <Search size={14} color="#6b7280" />
                            </button>
                          )}
                        </div>
                      )}
                    </div>
                  );
                })}
            </div>
            <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
              <button
                onClick={() => { setPopupEditOpen(false); setPopupEditRow(null); }}
                className="mes-btn"
                style={{ padding: '8px 16px' }}
              >
                {t('common.cancel')}
              </button>
              <button
                onClick={() => popupEditRow && handlePopupSave(popupEditRow)}
                className="mes-btn mes-btn-save"
                style={{ padding: '8px 16px' }}
              >
                {t('common.apply')}
              </button>
            </div>
          </>
        )}
      </Modal>

      <Modal
        open={clipboardHelpOpen}
        onClose={() => setClipboardHelpOpen(false)}
        title={t('grid.clipboardHelp')}
        compact
        width={420}
      >
        <div style={{ fontSize: 'var(--font-size-base)', lineHeight: 1.8, color: '#1e293b' }}>
          <p style={{ fontWeight: 600, marginBottom: 8 }}>그리드에서 엑셀로 복사/붙이기 사용법</p>
          <ol style={{ margin: 0, paddingLeft: 20, marginBottom: 16 }}>
            <li><strong>복사/붙이기 ON</strong> 버튼 클릭 (클립보드 모드 활성화)</li>
            <li>시작 셀 <strong>클릭</strong> → 앵커 지점 설정</li>
            <li>끝 셀 <strong>Shift+클릭</strong> → 사각형 범위가 파란색으로 하이라이트</li>
            <li><strong>Ctrl+C</strong> → 선택된 범위가 TSV(탭 구분) 형식으로 클립보드에 복사</li>
            <li>엑셀에서 <strong>Ctrl+V</strong> → 붙여넣기</li>
          </ol>
          <p style={{ fontWeight: 600, marginBottom: 8 }}>엑셀에서 그리드로 복사/붙이기 사용법</p>
          <ol style={{ margin: 0, paddingLeft: 20 }}>
            <li>엑셀에서 복사할 범위를 선택 후 <strong>Ctrl+C</strong></li>
            <li><strong>복사/붙이기 ON</strong> 버튼 클릭 (클립보드 모드 활성화)</li>
            <li>그리드에서 붙여넣기 시작 셀을 <strong>클릭</strong></li>
            <li><strong>Ctrl+V</strong> → 엑셀 데이터가 그리드에 붙여넣기</li>
            <li>행이 부족하면 자동으로 추가됩니다</li>
          </ol>
        </div>
      </Modal>
    </div>
  );
});
