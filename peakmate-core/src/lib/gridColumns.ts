import type { ColDef } from 'ag-grid-community';

/**
 * 사용(Y) / 미사용(N) 컬럼 정의를 생성한다.
 * field 기본값은 'isActive', headerName 기본값은 '사용'.
 */
export function createIsActiveColumn(overrides?: Partial<ColDef>): ColDef {
  return {
    field: 'isActive',
    headerName: '사용',
    width: 80,
    cellEditor: 'agSelectCellEditor',
    cellEditorParams: { values: ['Y', 'N'] },
    valueFormatter: (params) => (params.value === 'Y' ? '사용' : params.value === 'N' ? '미사용' : ''),
    cellStyle: (params) => (params.value === 'N' ? { color: '#94a3b8' } : {}),
    ...overrides,
  };
}
