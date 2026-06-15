import { useState, useRef, useMemo, useCallback } from 'react';
import { usePermission } from '@/hooks/usePermission';
import { PageTitle } from '@/components/ui/PageTitle';
import { PeakEditGrid } from '@/components/grid';
import type { PeakEditGridRef } from '@/components/grid';
import type { ColDef } from 'ag-grid-community';
import { useToast } from '@/shared/components/toast/ToastProvider';

/*
  Takt Time = 60 / 생산속도(kg/hr)
  P3-E: 8m/s → 77.41 kg/hr → takt = 60 / 77.41 = 0.7751 min/kg
  P3-F: 6m/s → 40.82 kg/hr → takt = 60 / 40.82 = 1.4698 min/kg
*/
const MOCK_TAKT: Record<string, unknown>[] = [
  { id: 1, lineCode: 'P3-E', productCode: 'CQ8',   taktTimeMinPerKg: 0.7751, minWorkerCount: 4, isActive: 'Y' },
  { id: 2, lineCode: 'P3-E', productCode: 'CL6',   taktTimeMinPerKg: 0.7751, minWorkerCount: 4, isActive: 'Y' },
  { id: 3, lineCode: 'P3-E', productCode: 'AB6',   taktTimeMinPerKg: 0.7751, minWorkerCount: 4, isActive: 'Y' },
  { id: 4, lineCode: 'P3-E', productCode: 'CQ6',   taktTimeMinPerKg: 0.7751, minWorkerCount: 4, isActive: 'Y' },
  { id: 5, lineCode: 'P3-E', productCode: 'PD6',   taktTimeMinPerKg: 0.7751, minWorkerCount: 4, isActive: 'Y' },
  { id: 6, lineCode: 'P3-F', productCode: '4C4_S', taktTimeMinPerKg: 1.4698, minWorkerCount: 4, isActive: 'Y' },
  { id: 7, lineCode: 'P3-F', productCode: '4C4_L', taktTimeMinPerKg: 1.4698, minWorkerCount: 4, isActive: 'Y' },
  { id: 8, lineCode: 'P3-F', productCode: '4C4_A', taktTimeMinPerKg: 1.4698, minWorkerCount: 4, isActive: 'N' },
];

export default function ApsTaktTimePage() {
  const perm = usePermission('PM0042');
  const { notify } = useToast();
  const editGridRef = useRef<PeakEditGridRef>(null);

  const [data, setData] = useState<Record<string, unknown>[]>(MOCK_TAKT);
  const [showAll, setShowAll] = useState(false);
  const displayData = useMemo(
    () => showAll ? data : data.filter(r => r.isActive === 'Y'),
    [data, showAll],
  );

  const handleAddRow = useCallback(() => {
    editGridRef.current?.appendRow({
      lineCode: 'P3-E', productCode: '', taktTimeMinPerKg: null,
      minWorkerCount: 4, isActive: 'Y',
    });
  }, []);

  const handleDeleteRow = useCallback(() => {
    editGridRef.current?.deleteSelectedRows();
  }, []);

  const handleBatchSave = useCallback(
    async (rows: { _rowState: string; [key: string]: unknown }[]) => {
      notify(`목업 데이터입니다 (변경 ${rows.length}건). DB 구현 후 저장 가능합니다.`, { type: 'info' });
      setData(prev => {
        const updated = [...prev];
        rows.forEach(r => {
          const idx = updated.findIndex(d => d.id === r.id);
          if (r._rowState === 'created') updated.push({ ...r, id: Date.now() });
          else if (r._rowState === 'updated' && idx >= 0) updated[idx] = { ...r };
          else if (r._rowState === 'deleted' && idx >= 0) updated.splice(idx, 1);
        });
        return updated;
      });
    },
    [notify],
  );

  const columns = useMemo<ColDef[]>(() => [
    {
      field: 'lineCode', headerName: '호기', width: 100,
      headerClass: 'ag-header-required',
      editable: (p) => !p.data?.id,
      cellEditor: 'agSelectCellEditor',
      cellEditorParams: { values: ['P3-E', 'P3-F'] },
    },
    {
      field: 'productCode', headerName: '제품코드(모델)', width: 150,
      headerClass: 'ag-header-required',
      editable: (p) => !p.data?.id,
    },
    {
      field: 'taktTimeMinPerKg', headerName: 'Takt Time (min/kg)', width: 170,
      headerClass: 'ag-header-required',
      cellDataType: 'number' as const,
      valueFormatter: (p: { value: unknown }) => p.value != null ? Number(p.value).toFixed(4) : '',
    },
    {
      field: 'minWorkerCount', headerName: '최소인원', width: 100,
      cellDataType: 'number' as const,
    },
    {
      field: 'isActive', headerName: '사용', width: 80,
      cellEditor: 'agSelectCellEditor',
      cellEditorParams: { values: ['Y', 'N'] },
      valueFormatter: (p: { value: unknown }) => p.value === 'Y' ? '사용' : '미사용',
      cellStyle: (p: { value: unknown }) => p.value === 'N' ? { color: '#94a3b8' } : {},
    },
  ], []);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      <div className="grid-toolbar">
        <PageTitle />
        <div style={{ display: 'flex', gap: 6, marginLeft: 'auto' }}>
          <button onClick={() => setShowAll(v => !v)} className="mes-btn" style={{ fontSize: 11 }}>
            {showAll ? '미사용 포함' : '미사용 제외'}
          </button>
          <button onClick={handleAddRow} className="mes-btn">행추가</button>
          <button onClick={handleDeleteRow} className="mes-btn mes-btn-delete">행삭제</button>
        </div>
      </div>

      <PeakEditGrid
        ref={editGridRef}
        gridId="aps-takt-time"
        columns={columns}
        data={displayData}
        bodyHeight="fitToParent"
        onBatchSave={handleBatchSave}
        saveButtonLabel="저장"
        permission={perm}
      />
    </div>
  );
}
