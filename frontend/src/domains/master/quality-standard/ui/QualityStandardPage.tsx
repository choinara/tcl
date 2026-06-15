import { useState, useCallback, useEffect, useRef, useMemo } from 'react';
import { authFetch } from '@/lib/api';
import { usePermission } from '@/hooks/usePermission';
import { PageTitle } from '@/components/ui/PageTitle';
import { PeakEditGrid } from '@/components/grid';
import type { PeakEditGridRef } from '@/components/grid';
import type { ColDef } from 'ag-grid-community';
import { useToast } from '@/shared/components/toast/ToastProvider';

export default function QualityStandardPage() {
  const perm = usePermission('MM0090');
  const { notify } = useToast();
  const editGridRef = useRef<PeakEditGridRef>(null);

  const [allData, setAllData] = useState<Record<string, unknown>[]>([]);
  const [showAll, setShowAll] = useState(false);
  const displayData = useMemo(() => showAll ? allData : allData.filter(r => r.isActive === 'Y'), [allData, showAll]);

  const fetchData = useCallback(async () => {
    try {
      const res = await authFetch('/api/master/quality-standards');
      if (res.ok) {
        const json = await res.json();
        const items = json.data?.content || [];
        setAllData(items);
      }
    } catch {
      notify('품질기준 조회에 실패했습니다', { type: 'error' });
    }
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  const columns = useMemo<ColDef[]>(() => [
    { field: 'customerName', headerName: '고객명', width: 120, editable: true },
    { field: 'category', headerName: '구분', width: 120, editable: true },
    { field: 'variety', headerName: '품종', width: 150, editable: true },
    { field: 'surfaceTreatment', headerName: '표면처리', width: 150, editable: true },
    { field: 'specThickness', headerName: '두께', width: 120, editable: true },
    { field: 'specWidth', headerName: '폭', width: 100, editable: true },
    { field: 'specBurr', headerName: 'Burr.', width: 80, editable: true },
    { field: 'specEdgeW', headerName: 'Edge w', width: 120, editable: true },
    { field: 'specEdgeT', headerName: 'Edge t', width: 120, editable: true },
    { field: 'specPlatingThickness', headerName: '도금두께', width: 100, editable: true },
    { field: 'specPlatingAdhesion', headerName: '도금밀착성', width: 100, editable: true },
    { field: 'specSaltSpray', headerName: '염수분무', width: 100, editable: true },
    { field: 'specCrAmount', headerName: 'Cr량', width: 100, editable: true },
    { field: 'specAppearance', headerName: '제품 외관', width: 120, editable: true },
    { field: 'specSurfaceRoughness', headerName: '표면조도', width: 100, editable: true },
    { field: 'specDeltaCr', headerName: '\u25b3Cr', width: 80, editable: true },
    { field: 'specIcp', headerName: 'ICP', width: 120, editable: true },
    { field: 'isActive', headerName: '사용', width: 80, editable: true, cellEditor: 'agSelectCellEditor', cellEditorParams: { values: ['Y', 'N'] }, valueFormatter: (params: { value: unknown }) => params.value === 'Y' ? '사용' : '미사용', cellStyle: (params: { value: unknown }) => params.value === 'N' ? { color: '#94a3b8' } : {} },
  ], []);

  const handleBatchSave = useCallback(async (rows: { _rowState: string; [key: string]: unknown }[]) => {
    const res = await authFetch('/api/master/quality-standards/batch', {
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
        gridId="master-quality-standard"
        columns={columns}
        data={displayData}
        bodyHeight="fitToParent"
        onBatchSave={handleBatchSave}
        saveButtonLabel="저장"
        permission={perm}      />
    </div>
  );
}
