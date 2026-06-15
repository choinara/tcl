import { useState, useCallback, useEffect, useRef, useMemo } from 'react';
import { authFetch } from '@/lib/api';
import { usePermission } from '@/hooks/usePermission';
import { PageTitle } from '@/components/ui/PageTitle';
import { PeakEditGrid } from '@/components/grid';
import type { PeakEditGridRef } from '@/components/grid';
import type { ColDef } from 'ag-grid-community';
import { useToast } from '@/shared/components/toast/ToastProvider';

export default function RawMaterialPage() {
  const perm = usePermission('MM0060');
  const { notify } = useToast();
  const editGridRef = useRef<PeakEditGridRef>(null);

  const [allData, setAllData] = useState<Record<string, unknown>[]>([]);
  const [showAll, setShowAll] = useState(false);
  const displayData = useMemo(() => showAll ? allData : allData.filter(r => r.isActive === 'Y'), [allData, showAll]);

  const fetchData = useCallback(async () => {
    try {
      const res = await authFetch('/api/master/raw-materials');
      if (res.ok) {
        const json = await res.json();
        const items = json.data?.content || [];
        setAllData(items);
      }
    } catch {
      notify('원자재 조회에 실패했습니다', { type: 'error' });
    }
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  const columns = useMemo<ColDef[]>(() => [
    { field: 'materialCode', headerName: '자재코드', width: 120, editable: true },
    { field: 'materialType', headerName: '재질', width: 120, editable: true },
    { field: 'modelName', headerName: '모델', width: 150, editable: true },
    { field: 'supplierName', headerName: '입고처', width: 150, editable: true },
    { field: 'rawMaterial', headerName: '원재료', width: 150, editable: true },
    { field: 'productSpec', headerName: '제품규격', width: 200, editable: true },
    { field: 'hardnessType', headerName: '연/경질', width: 100, editable: true },
    { field: 'isActive', headerName: '사용', width: 80, editable: true, cellEditor: 'agSelectCellEditor', cellEditorParams: { values: ['Y', 'N'] }, valueFormatter: (params: { value: unknown }) => params.value === 'Y' ? '사용' : '미사용', cellStyle: (params: { value: unknown }) => params.value === 'N' ? { color: '#94a3b8' } : {} },
  ], []);

  const handleBatchSave = useCallback(async (rows: { _rowState: string; [key: string]: unknown }[]) => {
    const res = await authFetch('/api/master/raw-materials/batch', {
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
        gridId="master-raw-material"
        columns={columns}
        data={displayData}
        bodyHeight="fitToParent"
        onBatchSave={handleBatchSave}
        saveButtonLabel="저장"
        permission={perm}      />
    </div>
  );
}
