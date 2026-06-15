import { useState, useCallback, useEffect, useRef, useMemo } from 'react';
import { authFetch } from '@/lib/api';
import { usePermission } from '@/hooks/usePermission';
import { PageTitle } from '@/components/ui/PageTitle';
import { PeakEditGrid } from '@/components/grid';
import type { PeakEditGridRef } from '@/components/grid';
import type { ColDef } from 'ag-grid-community';
import { useToast } from '@/shared/components/toast/ToastProvider';
import { useCommonCodes } from '@/hooks/useCommonCodes';

export default function EquipmentPage() {
  const perm = usePermission('MM0050');
  const { notify } = useToast();
  const editGridRef = useRef<PeakEditGridRef>(null);
  const codes = useCommonCodes('EQUIP_CATEGORY');
  const equipCategories = useMemo(() => (codes['EQUIP_CATEGORY'] ?? []).map(c => c.code), [codes]);

  const [allData, setAllData] = useState<Record<string, unknown>[]>([]);
  const [showAll, setShowAll] = useState(false);
  const displayData = useMemo(() => showAll ? allData : allData.filter(r => r.isActive === 'Y'), [allData, showAll]);

  const fetchData = useCallback(async () => {
    try {
      const res = await authFetch('/api/master/equipments');
      if (res.ok) {
        const json = await res.json();
        const items = json.data?.content || [];
        setAllData(items);
      }
    } catch {
      notify('설비 조회에 실패했습니다', { type: 'error' });
    }
  }, [notify]);

  // eslint-disable-next-line react-hooks/set-state-in-effect
  useEffect(() => { fetchData(); }, [fetchData]);

  const columns = useMemo<ColDef[]>(() => [
    { field: 'equipCode', headerName: '설비코드', width: 100, editable: (p) => !p.data?.id },
    { field: 'category', headerName: '구분', width: 100, editable: true, cellEditor: 'agSelectCellEditor', cellEditorParams: { values: equipCategories.length > 0 ? equipCategories : ['CU_NEG', 'AL_POS'] } },
    { field: 'unitNumber', headerName: '호기', width: 80, editable: true },
    { field: 'lineName', headerName: '라인', width: 80, editable: true },
    { field: 'modelNm', headerName: '모델명', width: 150, editable: true },
    { field: 'manufacturer', headerName: '제조사', width: 120, editable: true },
    { field: 'purchaseCorpCode', headerName: '구매처', width: 100, editable: true },
    { field: 'buyDate', headerName: '구매일자', width: 110, editable: true },
    { field: 'maxSpeed', headerName: '속도(최대)', width: 100, editable: true, cellDataType: 'number' },
    { field: 'voltage', headerName: '전압', width: 80, editable: true },
    { field: 'pressure', headerName: '압력', width: 80, editable: true },
    { field: 'installLocation', headerName: '설치위치', width: 150, editable: true },
    { field: 'equipTypeCode', headerName: '설비유형', width: 100, editable: true },
    { field: 'tactTime', headerName: 'Tact Time', width: 100, editable: true, cellDataType: 'number' },
    { field: 'equipCapa', headerName: '설비용량', width: 100, editable: true, cellDataType: 'number' },
    { field: 'isActive', headerName: '사용', width: 70, editable: true, cellEditor: 'agSelectCellEditor', cellEditorParams: { values: ['Y', 'N'] }, valueFormatter: (params: { value: unknown }) => params.value === 'Y' ? '사용' : '미사용', cellStyle: (params: { value: unknown }) => params.value === 'N' ? { color: '#94a3b8' } : {} },
  ], [equipCategories]);

  const handleBatchSave = useCallback(async (rows: { _rowState: string; [key: string]: unknown }[]) => {
    const res = await authFetch('/api/master/equipments/batch', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(rows),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({ message: '서버 응답을 처리할 수 없습니다' }));
      throw new Error(err?.message || '저장에 실패했습니다.');
    }
    await fetchData();
    notify('저장되었습니다', { type: 'success' });
  }, [fetchData, notify]);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      <div className="grid-toolbar">
        <PageTitle />
        <button onClick={() => setShowAll(v => !v)} className="mes-btn" style={{ marginLeft: 'auto', fontSize: 11, backgroundColor: showAll ? undefined : 'var(--grid-row-hover, #f1f5f9)' }}>
          
          {showAll ? '미사용 포함' : '미사용 제외'}
        </button>
      </div>
      <PeakEditGrid
        ref={editGridRef}
        gridId="master-equipment-v2"
        columns={columns}
        data={displayData}
        bodyHeight="fitToParent"
        onBatchSave={handleBatchSave}
        saveButtonLabel="저장"
        permission={perm}      />
    </div>
  );
}
