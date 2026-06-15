import { useState, useCallback, useEffect, useRef, useMemo } from 'react';
import { authFetch } from '@/lib/api';
import { usePermission } from '@/hooks/usePermission';
import { PageTitle } from '@/components/ui/PageTitle';
import { PeakEditGrid } from '@/components/grid';
import type { PeakEditGridRef } from '@/components/grid';
import type { ColDef } from 'ag-grid-community';
import { useToast } from '@/shared/components/toast/ToastProvider';
import { useCommonCodes } from '@/hooks/useCommonCodes';

export default function PartnerPage() {
  const perm = usePermission('MM0120');
  const { notify } = useToast();
  const editGridRef = useRef<PeakEditGridRef>(null);
  const codes = useCommonCodes('PARTNER_TYPE', 'TRANSACTION_STATUS');
  const partnerTypes = useMemo(() => (codes['PARTNER_TYPE'] || []).map(c => c.code), [codes]);
  const transactionStatuses = useMemo(() => (codes['TRANSACTION_STATUS'] || []).map(c => c.code), [codes]);

  const [allData, setAllData] = useState<Record<string, unknown>[]>([]);
  const [showAll, setShowAll] = useState(false);
  const displayData = useMemo(() => showAll ? allData : allData.filter(r => r.isActive === 'Y'), [allData, showAll]);

  const fetchData = useCallback(async () => {
    try {
      const res = await authFetch('/api/master/partners');
      if (res.ok) {
        const json = await res.json();
        const items = json.data?.content || [];
        setAllData(items);
      }
    } catch {
      notify('협력사 조회에 실패했습니다', { type: 'error' });
    }
  }, [notify]);

  useEffect(() => { fetchData(); }, [fetchData]);

  const columns = useMemo<ColDef[]>(() => [
    { field: 'partnerCode', headerName: '업체코드', width: 120, editable: (p) => !p.data?.id },
    { field: 'partnerName', headerName: '업체명', width: 180, editable: true },
    { field: 'partnerType', headerName: '업체구분', width: 100, editable: true, cellEditor: 'agSelectCellEditor', cellEditorParams: { values: partnerTypes.length > 0 ? partnerTypes : ['MIXED'] } },
    { field: 'businessNumber', headerName: '사업자번호', width: 130, editable: true },
    { field: 'ceoName', headerName: '대표자명', width: 100, editable: true },
    { field: 'businessCategory', headerName: '업종', width: 120, editable: true },
    { field: 'businessType', headerName: '업태', width: 120, editable: true },
    { field: 'phone', headerName: '전화번호', width: 120, editable: true },
    { field: 'fax', headerName: '팩스', width: 120, editable: true },
    { field: 'email', headerName: '이메일', width: 180, editable: true },
    { field: 'address', headerName: '주소', width: 250, editable: true },
    { field: 'transactionStatus', headerName: '거래상태', width: 100, editable: true, cellEditor: 'agSelectCellEditor', cellEditorParams: { values: transactionStatuses.length > 0 ? transactionStatuses : ['ACTIVE'] } },
    { field: 'remark', headerName: '비고', width: 200, editable: true },
    { field: 'isActive', headerName: '사용', width: 80, editable: true, cellEditor: 'agSelectCellEditor', cellEditorParams: { values: ['Y', 'N'] }, valueFormatter: (params: { value: unknown }) => params.value === 'Y' ? '사용' : '미사용', cellStyle: (params: { value: unknown }) => params.value === 'N' ? { color: '#94a3b8' } : {} },
  ], [partnerTypes, transactionStatuses]);

  const handleBatchSave = useCallback(async (rows: { _rowState: string; [key: string]: unknown }[]) => {
    const res = await authFetch('/api/master/partners/batch', {
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
        gridId="master-partner"
        columns={columns}
        data={displayData}
        bodyHeight="fitToParent"
        onBatchSave={handleBatchSave}
        saveButtonLabel="저장"
        permission={perm}      />
    </div>
  );
}
