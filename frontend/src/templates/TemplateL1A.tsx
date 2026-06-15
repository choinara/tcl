/**
 * [L1-A] 단일 그리드 + 인라인 편집 템플릿
 *
 * 사용 상황: 기준정보 CRUD — 셀 직접 편집 후 일괄 저장
 * 대표 메뉴: 고객관리(MM0010), 제품관리(MM0060), 협력사관리(MM0120)
 *
 * 복사 후 처리:
 *   1. MENU_CODE, API_BASE, RowData 교체
 *   2. columns 정의 작성
 *   3. 필요 없는 필터 제거 / 필터 추가
 *   4. 공통코드 그룹 키 교체 (useCommonCodes 인수)
 */

import { useState, useCallback, useEffect, useMemo, useRef } from 'react';
import type { ColDef } from 'ag-grid-community';
import { useTranslation } from 'react-i18next';
import { authFetch } from '@/lib/api';
import { usePermission } from '@/hooks/usePermission';
import { useDateRange } from '@/hooks/useDateRange';
import { useCommonCodes } from '@/hooks/useCommonCodes';
import { useToast } from '@/shared/components/toast/ToastProvider';
import { PageFilterShell } from '@/components/layout/PageFilterShell';
import { PeakEditGrid } from '@/components/grid';
import type { PeakEditGridRef } from '@/components/grid';
import { DateRangeFilter } from '@/components/ui/DateRangeFilter';
import { DropdownFilter } from '@/components/ui/DropdownFilter';
import { FilterField } from '@/components/ui/FilterField';
import { RefreshButton } from '@/components/ui/RefreshButton';

// TODO: 메뉴코드 + API 경로 교체
const MENU_CODE = 'XX0000';
const API_BASE = '/api/xxx/yyy';

// TODO: 행 데이터 타입 정의
interface RowData {
  id?: number;
  code?: string;
  name?: string;
  isActive?: string;
  [key: string]: unknown;
}

export default function TemplateL1APage() {
  const { t } = useTranslation();
  const { notify } = useToast();
  const perm = usePermission(MENU_CODE);
  const gridRef = useRef<PeakEditGridRef>(null);

  // 필터 상태
  const { dateFrom, dateTo, setDateFrom, setDateTo } = useDateRange();
  const [status, setStatus] = useState('');
  const [showAll, setShowAll] = useState(false);

  // TODO: 필요한 공통코드 그룹 추가
  const { allCodes } = useCommonCodes(['STATUS_CODE']);
  const statusOptions = allCodes['STATUS_CODE'] ?? [];

  const [allData, setAllData] = useState<RowData[]>([]);
  const displayData = useMemo(
    () => (showAll ? allData : allData.filter((r) => r.isActive !== 'N')),
    [allData, showAll],
  );

  const fetchData = useCallback(async () => {
    try {
      const params = new URLSearchParams();
      if (dateFrom) params.set('startDate', dateFrom);
      if (dateTo) params.set('endDate', dateTo);
      if (status) params.set('status', status);
      const res = await authFetch(`${API_BASE}?${params}`);
      if (!res.ok) throw new Error('조회 실패');
      const json = await res.json();
      setAllData(json.data?.content ?? json.data ?? []);
    } catch (e) {
      notify(e instanceof Error ? e.message : '조회 중 오류가 발생했습니다', { type: 'error' });
    }
  }, [dateFrom, dateTo, status, notify]);

  useEffect(() => { fetchData(); }, [fetchData]);

  // TODO: 컬럼 정의 작성
  const columns = useMemo<ColDef<RowData>[]>(() => [
    { field: 'code',     headerName: '코드', width: 130, editable: (p) => !p.data?.id },
    { field: 'name',     headerName: '명칭', width: 200, editable: true },
    {
      field: 'isActive', headerName: '사용', width: 80, editable: true,
      cellEditor: 'agSelectCellEditor',
      cellEditorParams: { values: ['Y', 'N'] },
      valueFormatter: (p) => p.value === 'Y' ? '사용' : '미사용',
      cellStyle: (p) => p.value === 'N' ? { color: '#94a3b8' } : {},
    },
  ], []);

  const handleBatchSave = useCallback(async (
    rows: { _rowState: string; [key: string]: unknown }[],
  ) => {
    const res = await authFetch(`${API_BASE}/batch`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(rows),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({ message: '서버 응답을 처리할 수 없습니다' }));
      throw new Error(err?.message ?? '저장에 실패했습니다.');
    }
    await fetchData();
    notify('저장되었습니다', { type: 'success' });
  }, [fetchData, notify]);

  return (
    <PageFilterShell
      title={t(`menu.${MENU_CODE}`)}
      toolbar={
        <>
          <DateRangeFilter
            label="기간"
            dateFrom={dateFrom} dateTo={dateTo}
            onChangeDateFrom={setDateFrom} onChangeDateTo={setDateTo}
          />
          <FilterField label="필터링:">
            <div style={{ display: 'flex', gap: 2 }}>
              <DropdownFilter
                options={statusOptions} value={status} onChange={setStatus}
                allLabel="상태 전체" width={110}
              />
              {/* TODO: 드롭다운 추가 시 여기에 DropdownFilter 추가 */}
            </div>
          </FilterField>
        </>
      }
      toolbarRight={
        <>
          <button
            className="mes-btn"
            onClick={() => setShowAll((v) => !v)}
          >
            {showAll ? '미사용 포함' : '미사용 제외'}
          </button>
          <RefreshButton onRefresh={fetchData} />
        </>
      }
    >
      <PeakEditGrid
        ref={gridRef}
        gridId={`${MENU_CODE}-grid`}
        columns={columns}
        data={displayData}
        onBatchSave={handleBatchSave}
        permission={perm}
      />
    </PageFilterShell>
  );
}
