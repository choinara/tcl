import { useState, useRef, useMemo, useCallback } from 'react';
import { usePermission } from '@/hooks/usePermission';
import { PageTitle } from '@/components/ui/PageTitle';
import { PeakEditGrid } from '@/components/grid';
import type { PeakEditGridRef } from '@/components/grid';
import type { ColDef } from 'ag-grid-community';
import { useToast } from '@/shared/components/toast/ToastProvider';

/* ---- 상수 ---- */
const SHIFT_TYPES = ['DAY', 'NIGHT'];
const CREW_CODES = ['CREW_A', 'CREW_B', 'CREW_C'];
const SHIFT_LABEL: Record<string, string> = { DAY: '주간', NIGHT: '야간' };
const CREW_LABEL: Record<string, string> = { CREW_A: 'A조', CREW_B: 'B조', CREW_C: 'C조' };

/*
  P3-E: 8m/s 생산속도 → 77.41 kg/hr × 12hr = 928.92 kg/교대
  P3-F: 6m/s 생산속도 → 40.82 kg/hr × 12hr = 489.84 kg/교대
  3교대 12시간 (A/B/C조 순환)
*/
const MOCK_CAPACITY: Record<string, unknown>[] = [
  // P3-E  2026-05-12(월) ~ 2026-05-16(금)
  { id:  1, lineCode: 'P3-E', slotDate: '2026-05-12', shift: 'DAY',   crew: 'CREW_A', workerCount: 4, availHours: 12, availWeightKg: 928.92, isActive: 'Y' },
  { id:  2, lineCode: 'P3-E', slotDate: '2026-05-12', shift: 'NIGHT', crew: 'CREW_B', workerCount: 4, availHours: 12, availWeightKg: 928.92, isActive: 'Y' },
  { id:  3, lineCode: 'P3-E', slotDate: '2026-05-13', shift: 'DAY',   crew: 'CREW_C', workerCount: 4, availHours: 12, availWeightKg: 928.92, isActive: 'Y' },
  { id:  4, lineCode: 'P3-E', slotDate: '2026-05-13', shift: 'NIGHT', crew: 'CREW_A', workerCount: 4, availHours: 12, availWeightKg: 928.92, isActive: 'Y' },
  { id:  5, lineCode: 'P3-E', slotDate: '2026-05-14', shift: 'DAY',   crew: 'CREW_B', workerCount: 4, availHours: 12, availWeightKg: 928.92, isActive: 'Y' },
  { id:  6, lineCode: 'P3-E', slotDate: '2026-05-14', shift: 'NIGHT', crew: 'CREW_C', workerCount: 4, availHours: 12, availWeightKg: 928.92, isActive: 'Y' },
  { id:  7, lineCode: 'P3-E', slotDate: '2026-05-15', shift: 'DAY',   crew: 'CREW_A', workerCount: 4, availHours: 12, availWeightKg: 928.92, isActive: 'Y' },
  { id:  8, lineCode: 'P3-E', slotDate: '2026-05-15', shift: 'NIGHT', crew: 'CREW_B', workerCount: 4, availHours: 12, availWeightKg: 928.92, isActive: 'Y' },
  { id:  9, lineCode: 'P3-E', slotDate: '2026-05-16', shift: 'DAY',   crew: 'CREW_C', workerCount: 4, availHours: 12, availWeightKg: 928.92, isActive: 'Y' },
  { id: 10, lineCode: 'P3-E', slotDate: '2026-05-16', shift: 'NIGHT', crew: 'CREW_A', workerCount: 4, availHours: 12, availWeightKg: 928.92, isActive: 'Y' },
  // P3-F  2026-05-12(월) ~ 2026-05-16(금)
  { id: 11, lineCode: 'P3-F', slotDate: '2026-05-12', shift: 'DAY',   crew: 'CREW_B', workerCount: 4, availHours: 12, availWeightKg: 489.84, isActive: 'Y' },
  { id: 12, lineCode: 'P3-F', slotDate: '2026-05-12', shift: 'NIGHT', crew: 'CREW_C', workerCount: 4, availHours: 12, availWeightKg: 489.84, isActive: 'Y' },
  { id: 13, lineCode: 'P3-F', slotDate: '2026-05-13', shift: 'DAY',   crew: 'CREW_A', workerCount: 4, availHours: 12, availWeightKg: 489.84, isActive: 'Y' },
  { id: 14, lineCode: 'P3-F', slotDate: '2026-05-13', shift: 'NIGHT', crew: 'CREW_B', workerCount: 4, availHours: 12, availWeightKg: 489.84, isActive: 'Y' },
  { id: 15, lineCode: 'P3-F', slotDate: '2026-05-14', shift: 'DAY',   crew: 'CREW_C', workerCount: 4, availHours: 12, availWeightKg: 489.84, isActive: 'Y' },
  { id: 16, lineCode: 'P3-F', slotDate: '2026-05-14', shift: 'NIGHT', crew: 'CREW_A', workerCount: 4, availHours: 12, availWeightKg: 489.84, isActive: 'Y' },
  { id: 17, lineCode: 'P3-F', slotDate: '2026-05-15', shift: 'DAY',   crew: 'CREW_B', workerCount: 4, availHours: 12, availWeightKg: 489.84, isActive: 'Y' },
  { id: 18, lineCode: 'P3-F', slotDate: '2026-05-15', shift: 'NIGHT', crew: 'CREW_C', workerCount: 4, availHours: 12, availWeightKg: 489.84, isActive: 'Y' },
  { id: 19, lineCode: 'P3-F', slotDate: '2026-05-16', shift: 'DAY',   crew: 'CREW_A', workerCount: 4, availHours: 12, availWeightKg: 489.84, isActive: 'Y' },
  { id: 20, lineCode: 'P3-F', slotDate: '2026-05-16', shift: 'NIGHT', crew: 'CREW_B', workerCount: 4, availHours: 12, availWeightKg: 489.84, isActive: 'Y' },
];

export default function ApsCapacitySlotPage() {
  const perm = usePermission('PM0041');
  const { notify } = useToast();
  const editGridRef = useRef<PeakEditGridRef>(null);

  const [data, setData] = useState<Record<string, unknown>[]>(MOCK_CAPACITY);
  const [startDate, setStartDate] = useState('2026-05-12');
  const [endDate, setEndDate] = useState('2026-05-16');
  const [showAll, setShowAll] = useState(false);

  const displayData = useMemo(() => {
    const filtered = data.filter(r => {
      const d = r.slotDate as string;
      return d >= startDate && d <= endDate;
    });
    return showAll ? filtered : filtered.filter(r => r.isActive === 'Y');
  }, [data, startDate, endDate, showAll]);

  const handleAddRow = useCallback(() => {
    editGridRef.current?.appendRow({
      lineCode: 'P3-E', slotDate: startDate, shift: 'DAY',
      crew: 'CREW_A', workerCount: 4, availHours: 12,
      availWeightKg: null, isActive: 'Y',
    });
  }, [startDate]);

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
      field: 'lineCode', headerName: '호기', width: 90,
      headerClass: 'ag-header-required',
      editable: (p) => !p.data?.id,
      cellEditor: 'agSelectCellEditor',
      cellEditorParams: { values: ['P3-E', 'P3-F'] },
    },
    {
      field: 'slotDate', headerName: '일자', width: 120,
      headerClass: 'ag-header-required',
      editable: (p) => !p.data?.id,
    },
    {
      field: 'shift', headerName: '교대', width: 90,
      headerClass: 'ag-header-required',
      editable: (p) => !p.data?.id,
      cellEditor: 'agSelectCellEditor',
      cellEditorParams: { values: SHIFT_TYPES },
      valueFormatter: (p: { value: unknown }) => SHIFT_LABEL[p.value as string] ?? (p.value as string),
    },
    {
      field: 'crew', headerName: '작업조', width: 90,
      cellEditor: 'agSelectCellEditor',
      cellEditorParams: { values: CREW_CODES },
      valueFormatter: (p: { value: unknown }) => CREW_LABEL[p.value as string] ?? (p.value as string),
    },
    {
      field: 'workerCount', headerName: '인원', width: 80,
      cellDataType: 'number' as const,
    },
    {
      field: 'availHours', headerName: '가용시간(hr)', width: 110,
      cellDataType: 'number' as const,
      valueFormatter: (p: { value: unknown }) => p.value != null ? Number(p.value).toFixed(1) : '',
    },
    {
      field: 'availWeightKg', headerName: '가용생산량(kg)', width: 130,
      cellDataType: 'number' as const,
      valueFormatter: (p: { value: unknown }) => p.value != null ? Number(p.value).toFixed(2) : '',
    },
    {
      field: 'isActive', headerName: '사용', width: 80,
      cellEditor: 'agSelectCellEditor',
      cellEditorParams: { values: ['Y', 'N'] },
      valueFormatter: (p: { value: unknown }) => p.value === 'Y' ? '사용' : '미사용',
      cellStyle: (p: { value: unknown }) => p.value === 'N' ? { color: '#94a3b8' } : {},
    },
  ], []);

  const inputStyle: React.CSSProperties = {
    height: 30, fontSize: 'var(--font-size-sm)', padding: '0 8px',
    border: '1px solid var(--color-border)', borderRadius: 4, background: '#fff',
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      <div className="grid-toolbar">
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
          <PageTitle />
          <input type="date" value={startDate} onChange={e => setStartDate(e.target.value)} style={inputStyle} />
          <span style={{ fontSize: 13 }}>~</span>
          <input type="date" value={endDate} onChange={e => setEndDate(e.target.value)} style={inputStyle} />
        </div>
        <div style={{ display: 'flex', gap: 6 }}>
          <button onClick={() => setShowAll(v => !v)} className="mes-btn" style={{ fontSize: 11 }}>
            {showAll ? '미사용 포함' : '미사용 제외'}
          </button>
          <button onClick={handleAddRow} className="mes-btn">행추가</button>
          <button onClick={handleDeleteRow} className="mes-btn mes-btn-delete">행삭제</button>
        </div>
      </div>

      <PeakEditGrid
        ref={editGridRef}
        gridId="aps-capacity-slot"
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
