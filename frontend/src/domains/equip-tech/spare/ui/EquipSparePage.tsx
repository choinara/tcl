import { useState, useCallback, useEffect, useRef, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { authFetch } from '@/lib/api';
import { usePermission } from '@/hooks/usePermission';
import { PageFilterShell } from '@/components/layout/PageFilterShell';
import { PeakEditGrid } from '@/components/grid';
import type { PeakEditGridRef } from '@/components/grid';
import { useToast } from '@/shared/components/toast/ToastProvider';
import { useCommonCodes, type CommonCode } from '@/hooks/useCommonCodes';
import { useConfirm } from '@/components/ui/ConfirmDialog';
import { Modal } from '@/components/ui/Modal';
import { AllCommunityModule, ModuleRegistry, type ColDef, type IRowNode } from 'ag-grid-community';
import { AgGridReact } from 'ag-grid-react';
ModuleRegistry.registerModules([AllCommunityModule]);

interface SpareRow {
  id?: number;
  spareCode?: string;
  spareName?: string;
  spareSpec?: string;
  unit?: string;
  unitPrice?: number;
  stockQty?: number;
  minStockQty?: number;
  spareTypeCode?: string;
  equipCategoryCode?: string;
  isActive?: string;
  remark?: string;
}

interface InoutRow {
  id?: number;
  spareId?: number;
  inoutType?: string;
  qty?: number;
  inoutDate?: string;
  usedEquipId?: number;
  reason?: string;
  inoutBy?: string;
  remark?: string;
}

export default function EquipSparePage() {
  const { t } = useTranslation();
  const perm = usePermission('ET0050');
  const { notify } = useToast();
  const { confirm: confirmDialog, ConfirmDialog } = useConfirm();
  const spareGridRef = useRef<PeakEditGridRef>(null);
  const codes = useCommonCodes('EQUIP_SPARE_TYPE', 'EQUIP_CATEGORY');
  const spareTypeList = useMemo(() => codes['EQUIP_SPARE_TYPE'] ?? [], [codes]);
  const equipCategoryList = useMemo(() => codes['EQUIP_CATEGORY'] ?? [], [codes]);

  const [spareList, setSpareList] = useState<SpareRow[]>([]);
  const [inoutList, setInoutList] = useState<InoutRow[]>([]);
  const [selectedSpare, setSelectedSpare] = useState<SpareRow | null>(null);
  const [showAll, setShowAll] = useState(false);
  const [showInoutForm, setShowInoutForm] = useState(false);
  const [inoutForm, setInoutForm] = useState<{ inoutType: string; qty: string; inoutDate: string; reason: string; inoutBy: string }>({
    inoutType: 'IN', qty: '', inoutDate: new Date().toISOString().split('T')[0], reason: '', inoutBy: '',
  });

  const displaySpares = useMemo(() => showAll ? spareList : spareList.filter(r => r.isActive === 'Y'), [spareList, showAll]);

  const fetchSpares = useCallback(async () => {
    try {
      const res = await authFetch('/api/et/spare');
      if (res.ok) {
        const json = await res.json();
        setSpareList(json.data?.content || []);
      }
    } catch {
      notify(t('message.networkError', 'Spare 목록 조회에 실패했습니다'), { type: 'error' });
    }
  }, [notify, t]);

  const fetchInout = useCallback(async (spareId: number) => {
    try {
      const res = await authFetch(`/api/et/spare/${spareId}/inout`);
      if (res.ok) {
        const json = await res.json();
        setInoutList(json.data || []);
      }
    } catch {
      notify(t('message.networkError', '입출고 이력 조회에 실패했습니다'), { type: 'error' });
    }
  }, [notify, t]);

  useEffect(() => { fetchSpares(); }, [fetchSpares]);

  const spareColumns = useMemo<ColDef[]>(() => [
    { field: 'spareCode', headerName: '코드', width: 100, editable: (p) => !p.data?.id },
    { field: 'spareName', headerName: '부품명', width: 180, editable: true },
    { field: 'spareSpec', headerName: '규격', width: 130, editable: true },
    { field: 'unit', headerName: '단위', width: 70, editable: true },
    { field: 'unitPrice', headerName: '단가', width: 100, editable: true, cellDataType: 'number' },
    { field: 'stockQty', headerName: '재고', width: 80, editable: true, cellDataType: 'number',
      cellStyle: (p) => {
        const stock = p.value as number | undefined;
        const minStock = (p.data as SpareRow | undefined)?.minStockQty;
        return stock !== undefined && minStock !== undefined && stock <= minStock ? { color: '#ef4444', fontWeight: 600 } : {};
      },
    },
    { field: 'minStockQty', headerName: '최소재고', width: 90, editable: true, cellDataType: 'number' },
    {
      field: 'spareTypeCode', headerName: '구분', width: 110, editable: false,
      valueFormatter: (p) => {
        const c = spareTypeList.find((x: CommonCode) => x.code === p.value);
        return c ? c.codeName : String(p.value ?? '');
      },
      cellRenderer: (p: { value: unknown; data: Record<string, unknown>; node: IRowNode }) => (
        <select
          value={(p.value as string) ?? ''}
          style={{ width: '100%', height: '100%', border: 'none', background: 'transparent', fontSize: 12 }}
          onChange={e => p.node.setDataValue('spareTypeCode', e.target.value)}
        >
          <option value="">--</option>
          {spareTypeList.map((c: CommonCode) => <option key={c.code} value={c.code}>{c.codeName}</option>)}
        </select>
      ),
    },
    {
      field: 'equipCategoryCode', headerName: '적용설비', width: 110, editable: false,
      valueFormatter: (p) => {
        const c = equipCategoryList.find((x: CommonCode) => x.code === p.value);
        return c ? c.codeName : String(p.value ?? '');
      },
      cellRenderer: (p: { value: unknown; data: Record<string, unknown>; node: IRowNode }) => (
        <select
          value={(p.value as string) ?? ''}
          style={{ width: '100%', height: '100%', border: 'none', background: 'transparent', fontSize: 12 }}
          onChange={e => p.node.setDataValue('equipCategoryCode', e.target.value)}
        >
          <option value="">--</option>
          {equipCategoryList.map((c: CommonCode) => <option key={c.code} value={c.code}>{c.codeName}</option>)}
        </select>
      ),
    },
    {
      field: 'isActive', headerName: '사용', width: 80, editable: false,
      valueFormatter: (p) => p.value === 'Y' ? '사용' : '미사용',
      cellStyle: (p) => p.value === 'N' ? { color: '#94a3b8' } : {},
      cellRenderer: (p: { value: unknown; data: Record<string, unknown>; node: IRowNode }) => (
        <select
          value={(p.value as string) ?? 'Y'}
          style={{ width: '100%', height: '100%', border: 'none', background: 'transparent', fontSize: 12 }}
          onChange={e => p.node.setDataValue('isActive', e.target.value)}
        >
          <option value="Y">사용</option>
          <option value="N">미사용</option>
        </select>
      ),
    },
  ], [spareTypeList, equipCategoryList]);

  const inoutColumns = useMemo<ColDef<InoutRow>[]>(() => [
    { field: 'inoutDate', headerName: '일자', width: 110 },
    { field: 'inoutType', headerName: '구분', width: 70,
      valueFormatter: (p) => p.value === 'IN' ? '입고' : '출고',
      cellStyle: (p) => ({ color: p.value === 'IN' ? '#22c55e' : '#ef4444', fontWeight: 600 }),
    },
    { field: 'qty', headerName: '수량', width: 80 },
    { field: 'reason', headerName: '사유', width: 200 },
    { field: 'inoutBy', headerName: '처리자', width: 100 },
    { field: 'remark', headerName: '비고', flex: 1 },
  ], []);

  const handleSpareBatchSave = useCallback(async (rows: { _rowState: string; [key: string]: unknown }[]) => {
    const res = await authFetch('/api/et/spare/batch', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(rows),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({ message: '서버 응답을 처리할 수 없습니다' }));
      throw new Error(err?.message || '저장에 실패했습니다');
    }
    await fetchSpares();
    notify(t('message.saveSuccess', '저장되었습니다'), { type: 'success' });
  }, [fetchSpares, notify, t]);

  const handleSpareSelect = useCallback((row: Record<string, unknown>) => {
    const spare = row as SpareRow;
    setSelectedSpare(spare);
    if (spare.id) fetchInout(spare.id);
    else setInoutList([]);
  }, [fetchInout]);

  const handleInoutCancel = () => {
    setShowInoutForm(false);
    setInoutForm({ inoutType: 'IN', qty: '', inoutDate: new Date().toISOString().split('T')[0], reason: '', inoutBy: '' });
  };

  const handleInoutSubmit = useCallback(async () => {
    if (!selectedSpare?.id) return;
    if (!inoutForm.qty || +inoutForm.qty <= 0) { notify('수량을 입력해주세요', { type: 'error' }); return; }
    try {
      const res = await authFetch(`/api/et/spare/${selectedSpare.id}/inout`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          inoutType: inoutForm.inoutType,
          qty: +inoutForm.qty,
          inoutDate: inoutForm.inoutDate,
          reason: inoutForm.reason,
          inoutBy: inoutForm.inoutBy,
        }),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({ message: '서버 응답을 처리할 수 없습니다' }));
        throw new Error(err?.message || '입출고 등록에 실패했습니다');
      }
      notify(t('message.saveSuccess', '입출고가 등록되었습니다'), { type: 'success' });
      handleInoutCancel();
      await fetchInout(selectedSpare.id);
      await fetchSpares();
    } catch (e) {
      notify(e instanceof Error ? e.message : t('message.saveFailed', '입출고 등록에 실패했습니다'), { type: 'error' });
    }
  }, [selectedSpare, inoutForm, fetchInout, fetchSpares, notify, t]);

  const handleInoutDelete = useCallback(async (inoutId: number) => {
    if (!selectedSpare?.id) return;
    if (!await confirmDialog('입출고 이력을 삭제하시겠습니까?')) return;
    try {
      const res = await authFetch(`/api/et/spare/${selectedSpare.id}/inout/${inoutId}`, { method: 'DELETE' });
      if (!res.ok) throw new Error(t('message.deleteFailed', '삭제에 실패했습니다'));
      notify(t('message.deleteSuccess', '삭제되었습니다'), { type: 'success' });
      await fetchInout(selectedSpare.id);
      await fetchSpares();
    } catch {
      notify(t('message.deleteFailed', '입출고 이력 삭제에 실패했습니다'), { type: 'error' });
    }
  }, [selectedSpare, confirmDialog, fetchInout, fetchSpares, notify, t]);

  return (
    <>
      <PageFilterShell
        title={t('menu.ET0050')}
        toolbarRight={
          <button onClick={() => setShowAll(v => !v)} className="mes-btn" style={{ fontSize: 11 }}>
            {showAll ? '미사용 포함' : '미사용 제외'}
          </button>
        }
      >
        <div style={{ flex: 1, display: 'flex', gap: 8, overflow: 'hidden', padding: '0 0 8px' }}>
        {/* 좌측: Spare 마스터 */}
        <div style={{ flex: '0 0 65%', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
          <div style={{ fontSize: 12, fontWeight: 600, padding: '4px 0', color: 'var(--color-text-secondary)' }}>Spare 부품 목록</div>
          <PeakEditGrid
            ref={spareGridRef}
            gridId="equip-spare-master-v2"
            columns={spareColumns}
            data={displaySpares}
            bodyHeight="fitToParent"
            onBatchSave={handleSpareBatchSave}
            onRowClick={handleSpareSelect}
            saveButtonLabel="저장"
            permission={perm}
          />
        </div>
        {/* 우측: 입출고 이력 */}
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '4px 0' }}>
            <span style={{ fontSize: 12, fontWeight: 600, color: 'var(--color-text-secondary)' }}>
              입출고 이력 {selectedSpare ? `- ${selectedSpare.spareName}` : '(좌측에서 부품 선택)'}
            </span>
            {selectedSpare?.id && perm.canCreate && (
              <button className="mes-btn mes-btn-save" style={{ fontSize: 11, padding: '2px 8px', marginLeft: 'auto' }} onClick={() => setShowInoutForm(true)}>입출고 등록</button>
            )}
          </div>
          <div className="ag-theme-mes" style={{ flex: 1, overflow: 'hidden' }}>
            <AgGridReact
              rowData={inoutList}
              columnDefs={[
                ...inoutColumns,
                ...(perm.canDelete ? [{
                  headerName: '', width: 60, sortable: false,
                  cellRenderer: (p: { data: InoutRow }) => {
                    if (!p.data?.id) return null;
                    return (
                      <button
                        className="mes-btn mes-btn-delete"
                        style={{ fontSize: 10, padding: '1px 6px' }}
                        onClick={() => handleInoutDelete(p.data.id!)}
                      >삭제</button>
                    );
                  },
                } as ColDef<InoutRow>] : []),
              ]}
              defaultColDef={{ resizable: true, sortable: true }}
            />
          </div>
        </div>
        </div>
      </PageFilterShell>

      <Modal open={showInoutForm} onClose={handleInoutCancel} title="입출고 등록" width={400}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          <label style={{ fontSize: 13 }}>
            <span style={{ display: 'block', marginBottom: 4, color: 'var(--color-text-disabled)' }}>구분</span>
            <select value={inoutForm.inoutType} onChange={e => setInoutForm(f => ({ ...f, inoutType: e.target.value }))} style={{ width: '100%' }}>
              <option value="IN">입고</option>
              <option value="OUT">출고</option>
            </select>
          </label>
          <label style={{ fontSize: 13 }}>
            <span style={{ display: 'block', marginBottom: 4, color: 'var(--color-text-disabled)' }}>수량</span>
            <input type="number" value={inoutForm.qty} onChange={e => setInoutForm(f => ({ ...f, qty: e.target.value }))} style={{ width: '100%' }} />
          </label>
          <label style={{ fontSize: 13 }}>
            <span style={{ display: 'block', marginBottom: 4, color: 'var(--color-text-disabled)' }}>일자</span>
            <input type="date" value={inoutForm.inoutDate} onChange={e => setInoutForm(f => ({ ...f, inoutDate: e.target.value }))} style={{ width: '100%' }} />
          </label>
          <label style={{ fontSize: 13 }}>
            <span style={{ display: 'block', marginBottom: 4, color: 'var(--color-text-disabled)' }}>사유</span>
            <input value={inoutForm.reason} onChange={e => setInoutForm(f => ({ ...f, reason: e.target.value }))} style={{ width: '100%' }} />
          </label>
          <label style={{ fontSize: 13 }}>
            <span style={{ display: 'block', marginBottom: 4, color: 'var(--color-text-disabled)' }}>처리자</span>
            <input value={inoutForm.inoutBy} onChange={e => setInoutForm(f => ({ ...f, inoutBy: e.target.value }))} style={{ width: '100%' }} />
          </label>
        </div>
        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8, marginTop: 16 }}>
          <button className="mes-btn" onClick={handleInoutCancel}>취소</button>
          <button className="mes-btn mes-btn-save" onClick={handleInoutSubmit}>등록</button>
        </div>
      </Modal>

      <ConfirmDialog />
    </>
  );
}
