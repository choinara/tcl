import type { ColDef } from 'ag-grid-community';

/** 그리드 기능 토글 설정 (사용자별 서버 저장) */
export interface GridFeatureToggles {
  /** 순번 표시 */
  rowNumber: boolean;
  /** 컬럼 고정 */
  columnPinning: boolean;
  /** 행 애니메이션 */
  animation: boolean;
  /** 셀 툴팁 */
  tooltip: boolean;
  /** 빠른 필터 (EditGrid만) */
  quickFilter: boolean;
  /** CSV 내보내기 */
  csvExport: boolean;
  /** 셀 텍스트 선택 */
  textSelection: boolean;
  /** 숫자 자동 포맷 */
  autoFormat: boolean;
  /** 조건부 스타일 (음수 빨간색) */
  conditionalStyle: boolean;
  /** 합계 행 */
  totalRowType: 'off' | 'pinned' | 'inline';
  /** 클라이언트 페이징 (EditGrid만) */
  clientPagination: boolean;
  /** 컬럼 필터 */
  columnFilter: boolean;
  /** 서버 검색 방식: debounce(자동) | button(조회 버튼) */
  searchMode: 'debounce' | 'button';
}

export const DEFAULT_GRID_FEATURES: GridFeatureToggles = {
  rowNumber: true,
  columnPinning: true,
  animation: true,
  tooltip: false,
  quickFilter: true,
  csvExport: false,
  textSelection: true,
  autoFormat: true,
  conditionalStyle: false,
  totalRowType: 'inline',
  clientPagination: false,
  columnFilter: true,
  searchMode: 'debounce',
};

/** AG Grid 기반 PeakDataGrid 공통 Props */
export interface PeakDataGridProps<T> {
  columns: ColDef<T>[];
  queryKey: string[];
  queryUrl: string;
  enableSearch?: boolean;
  keyword?: string;
  pageSize?: number;
  onRowClick?: (row: T) => void;
  toolbarLeft?: React.ReactNode;
  extraParams?: Record<string, string | undefined>;
  enableRowDrag?: boolean;
  reorderUrl?: string;
}

/** AG Grid 기반 PeakEditGrid 공통 Props */
export interface PeakEditGridProps {
  columns: ColDef[];
  data: Record<string, unknown>[];
  enableClipboard?: boolean;
  onBatchSave?: (rows: BatchRow[]) => void;
  bodyHeight?: number | 'fitToParent';
  rowHeight?: number;
  headerHeight?: number;
}

/** 서버사이드 페이징 파라미터 */
export interface GridQueryParams {
  page: number;
  size: number;
  sort?: string;
  direction?: 'ASC' | 'DESC';
  keyword?: string;
}

/** 서버사이드 페이징 응답 */
export interface PagedResponse<T> {
  content: T[];
  page: number;
  size: number;
  totalElements: number;
  totalPages: number;
  first: boolean;
  last: boolean;
}

/** API 공통 응답 */
export interface ApiResponse<T> {
  success: boolean;
  code: number;
  message: string;
  data: T;
  timestamp: string;
}

/** 일괄 저장 행 */
export interface BatchRow {
  _rowState: 'created' | 'updated' | 'deleted';
  [key: string]: unknown;
}
