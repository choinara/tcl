import { useState, useCallback, useEffect, useMemo, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { authFetch } from '@/lib/api';
import { usePermission } from '@/hooks/usePermission';
import { PageFilterShell } from '@/components/layout/PageFilterShell';
import { useToast } from '@/shared/components/toast/ToastProvider';
import { useConfirm } from '@/components/ui/ConfirmDialog';
import { Modal } from '@/components/ui/Modal';
import { DropdownFilter } from '@/components/ui/DropdownFilter';
import { KeywordFilter } from '@/components/ui/KeywordFilter';
import { useCommonCodes } from '@/hooks/useCommonCodes';
import { AllCommunityModule, ModuleRegistry, type ColDef } from 'ag-grid-community';
import { AgGridReact } from 'ag-grid-react';
ModuleRegistry.registerModules([AllCommunityModule]);

interface RepairRow {
  id?: number;
  repairNo?: string;
  equipId?: number;
  failDate?: string;
  repairStartDate?: string;
  repairEndDate?: string;
  failDesc?: string;
  repairDesc?: string;
  repairPerson?: string;
  repairTime?: number;
  repairCost?: number;
  failTypeCode?: string;
  shiftCode?: string;
  isClosed?: string;
  remark?: string;
}

const emptyForm = (): RepairRow => ({
  isClosed: 'N',
  failDate: new Date().toISOString().split('T')[0],
});

const IS_CLOSED_OPTIONS = [
  { value: 'N', label: '미완료' },
  { value: 'Y', label: '완료' },
];

export default function EquipRepairHistPage() {
  const { t } = useTranslation();
  const perm = usePermission('ET0030');
  const { notify } = useToast();
  const { confirm: confirmDialog, ConfirmDialog } = useConfirm();
  const codes = useCommonCodes('EQUIP_FAIL_TYPE', 'SHIFT_CODE');
  const failTypes = useMemo(() => codes['EQUIP_FAIL_TYPE'] ?? [], [codes]);
  const shiftCodes = useMemo(() => codes['SHIFT_CODE'] ?? [], [codes]);

  const [rows, setRows] = useState<RepairRow[]>([]);
  const [equipList, setEquipList] = useState<{ id: number; label: string }[]>([]);

  const equipListRef = useRef(equipList);
  equipListRef.current = equipList;
  const failTypesRef = useRef(failTypes);
  failTypesRef.current = failTypes;
  const gridRef = useRef<AgGridReact<RepairRow>>(null);

  const [filterClosed, setFilterClosed] = useState<string>('');
  const [keyword, setKeyword] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [editRow, setEditRow] = useState<RepairRow>(emptyForm());
  const [isNew, setIsNew] = useState(true);

  const fetchData = useCallback(async () => {
    try {
      const params = new URLSearchParams();
      if (filterClosed) params.set('isClosed', filterClosed);
      if (keyword) params.set('keyword', keyword);
      const res = await authFetch(`/api/et/repair-hist?${params}`);
      if (res.ok) {
        const json = await res.json();
        setRows(json.data?.content || []);
      }
    } catch {
      notify(t('message.networkError', '수리이력 조회에 실패했습니다'), { type: 'error' });
    }
  }, [filterClosed, keyword, notify, t]);

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

  const columns = useMemo<ColDef<RepairRow>[]>(() => [
    { field: 'repairNo', headerName: '수리번호', width: 130 },
    { field: 'equipId', headerName: '설비', width: 120, valueFormatter: (p) => {
      const eq = equipListRef.current.find(e => e.id === p.value);
      return eq ? eq.label : String(p.value ?? '');
    }},
    { field: 'failDate', headerName: '고장일자', width: 110 },
    { field: 'repairStartDate', headerName: '수리시작', width: 110 },
    { field: 'repairEndDate', headerName: '수리완료', width: 110 },
    { field: 'failTypeCode', headerName: '고장유형', width: 100, valueFormatter: (p) => {
      const c = failTypesRef.current.find(f => f.code === p.value);
      return c ? c.codeName : String(p.value ?? '');
    }},
    { field: 'repairPerson', headerName: '수리담당', width: 100 },
    { field: 'repairTime', headerName: '수리시간(h)', width: 100 },
    { field: 'isClosed', headerName: '완료', width: 70,
      valueFormatter: (p) => p.value === 'Y' ? '완료' : '미완료',
      cellStyle: (p) => p.value === 'Y' ? { color: '#22c55e', fontWeight: 600 } : {},
    },
    { field: 'shiftCode', headerName: '조', width: 80 },
  ], []);

  useEffect(() => {
    gridRef.current?.api?.refreshCells({ force: true });
  }, [equipList, failTypes]);

  const handleNew = () => { setEditRow(emptyForm()); setIsNew(true); setShowForm(true); };
  const handleEdit = (row: RepairRow) => { setEditRow({ ...row }); setIsNew(false); setShowForm(true); };
  const handleCancel = () => { setShowForm(false); };

  const handleSave = useCallback(async () => {
    if (!editRow.failDate) { notify('고장일자를 입력해주세요', { type: 'error' }); return; }
    try {
      const method = isNew ? 'POST' : 'PUT';
      const url = isNew ? '/api/et/repair-hist' : `/api/et/repair-hist/${editRow.id}`;
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

  const handleDelete = useCallback(async (row: RepairRow) => {
    if (!row.id) return;
    if (!await confirmDialog(`수리이력 ${row.repairNo ?? ''}을 삭제하시겠습니까?`)) return;
    try {
      const res = await authFetch(`/api/et/repair-hist/${row.id}`, { method: 'DELETE' });
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
        title={t('menu.ET0030')}
        toolbar={
          <>
            <DropdownFilter
              value={filterClosed}
              onChange={setFilterClosed}
              options={IS_CLOSED_OPTIONS}
              allLabel="전체"
              width={110}
            />
            <KeywordFilter
              value={keyword}
              onChange={setKeyword}
              placeholder="검색"
              onEnter={fetchData}
              width={150}
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

      <Modal open={showForm} onClose={handleCancel} title={isNew ? '수리이력 등록' : '수리이력 수정'} width={600}>
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
              <th style={thStyle}>고장유형</th>
              <td style={{ padding: '4px 8px' }}>
                <select value={editRow.failTypeCode ?? ''} onChange={e => setEditRow(r => ({ ...r, failTypeCode: e.target.value }))} style={{ width: '100%' }}>
                  <option value="">-- 선택 --</option>
                  {failTypes.map(c => <option key={c.code} value={c.code}>{c.codeName}</option>)}
                </select>
              </td>
            </tr>
            <tr>
              <th style={thStyle}>고장일자</th>
              <td style={{ padding: '4px 8px' }}>
                <input type="date" value={editRow.failDate ?? ''} onChange={e => setEditRow(r => ({ ...r, failDate: e.target.value }))} style={{ width: '100%' }} />
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
              <th style={thStyle}>수리시작</th>
              <td style={{ padding: '4px 8px' }}>
                <input type="date" value={editRow.repairStartDate ?? ''} onChange={e => setEditRow(r => ({ ...r, repairStartDate: e.target.value }))} style={{ width: '100%' }} />
              </td>
              <th style={thStyle}>수리완료</th>
              <td style={{ padding: '4px 8px' }}>
                <input type="date" value={editRow.repairEndDate ?? ''} onChange={e => setEditRow(r => ({ ...r, repairEndDate: e.target.value }))} style={{ width: '100%' }} />
              </td>
            </tr>
            <tr>
              <th style={thStyle}>수리담당</th>
              <td style={{ padding: '4px 8px' }}>
                <input value={editRow.repairPerson ?? ''} onChange={e => setEditRow(r => ({ ...r, repairPerson: e.target.value }))} style={{ width: '100%' }} />
              </td>
              <th style={thStyle}>완료여부</th>
              <td style={{ padding: '4px 8px' }}>
                <select value={editRow.isClosed ?? 'N'} onChange={e => setEditRow(r => ({ ...r, isClosed: e.target.value }))} style={{ width: '100%' }}>
                  <option value="N">미완료</option>
                  <option value="Y">완료</option>
                </select>
              </td>
            </tr>
            <tr>
              <th style={thStyle}>수리시간(h)</th>
              <td style={{ padding: '4px 8px' }}>
                <input type="number" step="0.5" value={editRow.repairTime ?? ''} onChange={e => setEditRow(r => ({ ...r, repairTime: e.target.value ? +e.target.value : undefined }))} style={{ width: '100%' }} />
              </td>
              <th style={thStyle}>수리비용</th>
              <td style={{ padding: '4px 8px' }}>
                <input type="number" value={editRow.repairCost ?? ''} onChange={e => setEditRow(r => ({ ...r, repairCost: e.target.value ? +e.target.value : undefined }))} style={{ width: '100%' }} />
              </td>
            </tr>
            <tr>
              <th style={thStyle}>고장내용</th>
              <td colSpan={3} style={{ padding: '4px 8px' }}>
                <textarea value={editRow.failDesc ?? ''} onChange={e => setEditRow(r => ({ ...r, failDesc: e.target.value }))} style={{ width: '100%', height: 72, resize: 'vertical' }} />
              </td>
            </tr>
            <tr>
              <th style={thStyle}>수리내용</th>
              <td colSpan={3} style={{ padding: '4px 8px' }}>
                <textarea value={editRow.repairDesc ?? ''} onChange={e => setEditRow(r => ({ ...r, repairDesc: e.target.value }))} style={{ width: '100%', height: 72, resize: 'vertical' }} />
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
