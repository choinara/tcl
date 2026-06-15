import { useState, useCallback, useEffect, useMemo, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { authFetch } from '@/lib/api';
import { usePermission } from '@/hooks/usePermission';
import { PageFilterShell } from '@/components/layout/PageFilterShell';
import { useToast } from '@/shared/components/toast/ToastProvider';
import { useConfirm } from '@/components/ui/ConfirmDialog';
import { Modal } from '@/components/ui/Modal';
import { DateRangeFilter } from '@/components/ui/DateRangeFilter';
import { useCommonCodes } from '@/hooks/useCommonCodes';
import { AllCommunityModule, ModuleRegistry, type ColDef } from 'ag-grid-community';
import { AgGridReact } from 'ag-grid-react';
ModuleRegistry.registerModules([AllCommunityModule]);

interface LossEventRow {
  id?: number;
  equipId?: number;
  failDate?: string;
  failTime?: string;
  recoveryDate?: string;
  recoveryTime?: string;
  lossTimeMin?: number;
  lossTypeCode?: string;
  shiftCode?: string;
  lossCause?: string;
  lossAction?: string;
  remark?: string;
  isClosed?: string;
}

const emptyForm = (): LossEventRow => ({
  isClosed: 'N',
  failDate: new Date().toISOString().split('T')[0],
});

export default function EquipLossEventPage() {
  const { t } = useTranslation();
  const perm = usePermission('ET0100');
  const { notify } = useToast();
  const { confirm: confirmDialog, ConfirmDialog } = useConfirm();
  const codes = useCommonCodes('EQUIP_FAIL_TYPE', 'SHIFT_CODE');
  const failTypes = useMemo(() => codes['EQUIP_FAIL_TYPE'] ?? [], [codes]);
  const shiftCodes = useMemo(() => codes['SHIFT_CODE'] ?? [], [codes]);

  const [rows, setRows] = useState<LossEventRow[]>([]);
  const [equipList, setEquipList] = useState<{ id: number; label: string }[]>([]);

  const equipListRef = useRef(equipList);
  equipListRef.current = equipList;
  const failTypesRef = useRef(failTypes);
  failTypesRef.current = failTypes;
  const shiftCodesRef = useRef(shiftCodes);
  shiftCodesRef.current = shiftCodes;
  const gridRef = useRef<AgGridReact<LossEventRow>>(null);

  const [startDate, setStartDate] = useState(() => {
    const d = new Date();
    d.setMonth(d.getMonth() - 3);
    return d.toISOString().split('T')[0];
  });
  const [endDate, setEndDate] = useState(() => new Date().toISOString().split('T')[0]);
  const [showForm, setShowForm] = useState(false);
  const [editRow, setEditRow] = useState<LossEventRow>(emptyForm());
  const [isNew, setIsNew] = useState(true);

  const fetchData = useCallback(async () => {
    try {
      const params = new URLSearchParams();
      if (startDate) params.set('startDate', startDate);
      if (endDate) params.set('endDate', endDate);
      const res = await authFetch(`/api/et/loss-event?${params}`);
      if (res.ok) {
        const json = await res.json();
        setRows(json.data?.content || []);
      }
    } catch {
      notify(t('message.networkError', 'Loss 이벤트 조회에 실패했습니다'), { type: 'error' });
    }
  }, [startDate, endDate, notify, t]);

  const fetchEquip = useCallback(async () => {
    try {
      const res = await authFetch('/api/master/equipments');
      if (res.ok) {
        const json = await res.json();
        const items = (json.data?.content || []) as { id: number; unitNumber: string; lineName: string }[];
        setEquipList(items.map(e => ({ id: e.id, label: `${e.unitNumber}-${e.lineName}` })));
      }
    } catch {
      notify(t('message.networkError', '설비 목록 조회에 실패했습니다'), { type: 'error' });
    }
  }, [notify, t]);

  useEffect(() => { fetchData(); }, [fetchData]);
  useEffect(() => { fetchEquip(); }, [fetchEquip]);

  const columns = useMemo<ColDef<LossEventRow>[]>(() => [
    { field: 'equipId', headerName: '설비', width: 120, valueFormatter: (p) => {
      const eq = equipListRef.current.find(e => e.id === p.value);
      return eq ? eq.label : String(p.value ?? '');
    }},
    { field: 'failDate', headerName: '발생일', width: 110 },
    { field: 'failTime', headerName: '발생시간', width: 90 },
    { field: 'recoveryDate', headerName: '복구일', width: 110 },
    { field: 'recoveryTime', headerName: '복구시간', width: 90 },
    { field: 'lossTimeMin', headerName: 'Loss(분)', width: 90 },
    { field: 'lossTypeCode', headerName: 'Loss유형', width: 100, valueFormatter: (p) => {
      const c = failTypesRef.current.find(f => f.code === p.value);
      return c ? c.codeName : String(p.value ?? '');
    }},
    { field: 'shiftCode', headerName: '조', width: 80, valueFormatter: (p) => {
      const c = shiftCodesRef.current.find(s => s.code === p.value);
      return c ? c.codeName : String(p.value ?? '');
    }},
    { field: 'isClosed', headerName: '완료', width: 70,
      valueFormatter: (p) => p.value === 'Y' ? '완료' : '미완료',
      cellStyle: (p) => p.value === 'Y' ? { color: '#22c55e', fontWeight: 600 } : {},
    },
    { field: 'lossCause', headerName: 'Loss 원인', flex: 1 },
  ], []);

  useEffect(() => {
    gridRef.current?.api?.refreshCells({ force: true });
  }, [equipList, failTypes, shiftCodes]);

  const handleNew = () => { setEditRow(emptyForm()); setIsNew(true); setShowForm(true); };
  const handleEdit = (row: LossEventRow) => { setEditRow({ ...row }); setIsNew(false); setShowForm(true); };
  const handleCancel = () => { setShowForm(false); };

  const handleSave = useCallback(async () => {
    if (!editRow.failDate) { notify('발생일을 입력해주세요', { type: 'error' }); return; }
    try {
      const method = isNew ? 'POST' : 'PUT';
      const url = isNew ? '/api/et/loss-event' : `/api/et/loss-event/${editRow.id}`;
      const res = await authFetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(editRow),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({ message: '서버 응답을 처리할 수 없습니다' }));
        throw new Error(err?.message || '저장에 실패했습니다');
      }
      notify(t('message.saveSuccess', '저장되었습니다'), { type: 'success' });
      setShowForm(false);
      await fetchData();
    } catch (e) {
      notify(e instanceof Error ? e.message : t('message.saveFailed', '저장에 실패했습니다'), { type: 'error' });
    }
  }, [editRow, isNew, fetchData, notify, t]);

  const handleDelete = useCallback(async (row: LossEventRow) => {
    if (!row.id) return;
    if (!await confirmDialog(`Loss 이벤트(ID: ${row.id})를 삭제하시겠습니까?`)) return;
    try {
      const res = await authFetch(`/api/et/loss-event/${row.id}`, { method: 'DELETE' });
      if (!res.ok) throw new Error(t('message.deleteFailed', '삭제에 실패했습니다'));
      notify(t('message.deleteSuccess', '삭제되었습니다'), { type: 'success' });
      setShowForm(false);
      await fetchData();
    } catch {
      notify(t('message.deleteFailed', '삭제에 실패했습니다'), { type: 'error' });
    }
  }, [confirmDialog, fetchData, notify, t]);

  const thStyle: React.CSSProperties = {
    textAlign: 'right', padding: '6px 8px', whiteSpace: 'nowrap',
    color: 'var(--color-text-disabled)', fontSize: 13, verticalAlign: 'top',
  };

  return (
    <>
      <PageFilterShell
        title={t('menu.ET0100')}
        toolbar={
          <>
            <DateRangeFilter
              dateFrom={startDate}
              dateTo={endDate}
              onDateFromChange={setStartDate}
              onDateToChange={setEndDate}
            />
            <button className="mes-btn" onClick={fetchData}>조회</button>
          </>
        }
        toolbarRight={perm.canCreate ? (
          <button className="mes-btn mes-btn-save" onClick={handleNew}>신규</button>
        ) : undefined}
      >
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
          <div className="ag-theme-mes" style={{ flex: 1, overflow: 'hidden' }}>
            <AgGridReact
              ref={gridRef}
              rowData={rows}
              columnDefs={columns}
              rowSelection="single"
              onRowClicked={e => e.data && handleEdit(e.data)}
              defaultColDef={{ resizable: true, sortable: true }}
            />
          </div>
        </div>
      </PageFilterShell>

      <Modal open={showForm} onClose={handleCancel} title={isNew ? 'Loss 이벤트 등록' : 'Loss 이벤트 수정'} width={640}>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <tbody>
            <tr>
              <th style={thStyle}>설비</th>
              <td style={{ padding: '4px 8px' }}>
                <select value={editRow.equipId ?? ''} onChange={e => setEditRow(r => ({ ...r, equipId: e.target.value ? +e.target.value : undefined }))} style={{ width: '100%' }}>
                  <option value="">-- 선택 --</option>
                  {equipList.map(eq => <option key={eq.id} value={eq.id}>{eq.label}</option>)}
                </select>
              </td>
              <th style={thStyle}>Loss유형</th>
              <td style={{ padding: '4px 8px' }}>
                <select value={editRow.lossTypeCode ?? ''} onChange={e => setEditRow(r => ({ ...r, lossTypeCode: e.target.value }))} style={{ width: '100%' }}>
                  <option value="">-- 선택 --</option>
                  {failTypes.map(c => <option key={c.code} value={c.code}>{c.codeName}</option>)}
                </select>
              </td>
            </tr>
            <tr>
              <th style={thStyle}>발생일</th>
              <td style={{ padding: '4px 8px' }}>
                <input type="date" value={editRow.failDate ?? ''} onChange={e => setEditRow(r => ({ ...r, failDate: e.target.value }))} style={{ width: '100%' }} />
              </td>
              <th style={thStyle}>발생시간</th>
              <td style={{ padding: '4px 8px' }}>
                <input type="time" value={editRow.failTime ?? ''} onChange={e => setEditRow(r => ({ ...r, failTime: e.target.value }))} style={{ width: '100%' }} />
              </td>
            </tr>
            <tr>
              <th style={thStyle}>복구일</th>
              <td style={{ padding: '4px 8px' }}>
                <input type="date" value={editRow.recoveryDate ?? ''} onChange={e => setEditRow(r => ({ ...r, recoveryDate: e.target.value }))} style={{ width: '100%' }} />
              </td>
              <th style={thStyle}>복구시간</th>
              <td style={{ padding: '4px 8px' }}>
                <input type="time" value={editRow.recoveryTime ?? ''} onChange={e => setEditRow(r => ({ ...r, recoveryTime: e.target.value }))} style={{ width: '100%' }} />
              </td>
            </tr>
            <tr>
              <th style={thStyle}>Loss시간(분)</th>
              <td style={{ padding: '4px 8px' }}>
                <input type="number" value={editRow.lossTimeMin ?? ''} onChange={e => setEditRow(r => ({ ...r, lossTimeMin: e.target.value ? +e.target.value : undefined }))} style={{ width: '100%' }} />
              </td>
              <th style={thStyle}>조편성</th>
              <td style={{ padding: '4px 8px' }}>
                <select value={editRow.shiftCode ?? ''} onChange={e => setEditRow(r => ({ ...r, shiftCode: e.target.value }))} style={{ width: '100%' }}>
                  <option value="">-- 선택 --</option>
                  {shiftCodes.map(c => <option key={c.code} value={c.code}>{c.codeName}</option>)}
                </select>
              </td>
            </tr>
            <tr>
              <th style={thStyle}>완료여부</th>
              <td style={{ padding: '4px 8px' }}>
                <select value={editRow.isClosed ?? 'N'} onChange={e => setEditRow(r => ({ ...r, isClosed: e.target.value }))} style={{ width: '100%' }}>
                  <option value="N">미완료</option>
                  <option value="Y">완료</option>
                </select>
              </td>
              <td colSpan={2} />
            </tr>
            <tr>
              <th style={thStyle}>Loss 원인</th>
              <td colSpan={3} style={{ padding: '4px 8px' }}>
                <textarea value={editRow.lossCause ?? ''} onChange={e => setEditRow(r => ({ ...r, lossCause: e.target.value }))} style={{ width: '100%', height: 72, resize: 'vertical' }} />
              </td>
            </tr>
            <tr>
              <th style={thStyle}>조치사항</th>
              <td colSpan={3} style={{ padding: '4px 8px' }}>
                <textarea value={editRow.lossAction ?? ''} onChange={e => setEditRow(r => ({ ...r, lossAction: e.target.value }))} style={{ width: '100%', height: 72, resize: 'vertical' }} />
              </td>
            </tr>
            <tr>
              <th style={thStyle}>비고</th>
              <td colSpan={3} style={{ padding: '4px 8px' }}>
                <input value={editRow.remark ?? ''} onChange={e => setEditRow(r => ({ ...r, remark: e.target.value }))} style={{ width: '100%' }} />
              </td>
            </tr>
          </tbody>
        </table>
        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8, marginTop: 16 }}>
          {!isNew && perm.canDelete && (
            <button className="mes-btn mes-btn-delete" onClick={() => handleDelete(editRow)}>삭제</button>
          )}
          <button className="mes-btn" onClick={handleCancel}>취소</button>
          {(isNew ? perm.canCreate : perm.canUpdate) && (
            <button className="mes-btn mes-btn-save" onClick={handleSave}>저장</button>
          )}
        </div>
      </Modal>

      <ConfirmDialog />
    </>
  );
}
