import { useState, useCallback, useEffect, useMemo, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { authFetch } from '@/lib/api';
import { usePermission } from '@/hooks/usePermission';
import { PageFilterShell } from '@/components/layout/PageFilterShell';
import { useToast } from '@/shared/components/toast/ToastProvider';
import { useConfirm } from '@/components/ui/ConfirmDialog';
import { Modal } from '@/components/ui/Modal';
import { useCommonCodes, type CommonCode } from '@/hooks/useCommonCodes';
import { AllCommunityModule, ModuleRegistry, type ColDef } from 'ag-grid-community';
import { AgGridReact } from 'ag-grid-react';
ModuleRegistry.registerModules([AllCommunityModule]);

const INSPECTION_ITEMS = [
  { no: 1, range: '진접공정', part: '블록수평(앞)', standard: '수평값 변화없을 것', method: 'height gauge' },
  { no: 2, range: '진접공정', part: '블록수평(뒤)', standard: '수평값 변화없을 것', method: 'height gauge' },
  { no: 3, range: '블록 넓이', part: '22mm(상부)', standard: '22mm 유지', method: '육안' },
  { no: 4, range: '블록 넓이', part: '22mm(하부)', standard: '22mm 유지', method: '육안' },
  { no: 5, range: '진접 실리콘', part: '1일교체확인(상부)', standard: '1일 교체', method: '육안' },
  { no: 6, range: '진접 실리콘', part: '1일교체확인(하부)', standard: '1일 교체', method: '육안' },
  { no: 7, range: 'Teflon tape', part: '실런트부(상부)', standard: '자국없을것', method: '육안' },
  { no: 8, range: 'Teflon tape', part: '실런트부(하부)', standard: '자국없을것', method: '육안' },
  { no: 9, range: '자재투입부', part: 'AL(표면처리,규격)', standard: 'AL 표면처리/규격확인', method: '육안,버니어' },
  { no: 10, range: '자재투입부', part: 'Nicu(규격,표면)', standard: 'Nicu 규격/표면확인', method: '육안,버니어' },
  { no: 11, range: '자재투입부', part: 'Film', standard: '총두께 0.102이하', method: '버니어,M.M' },
  { no: 12, range: '설정조건', part: '최적조건', standard: '시간,온도,압력 확인', method: '육안' },
  { no: 13, range: '필름공급부', part: 'Suction이상(상부)', standard: '기포발생시교체', method: '육안' },
  { no: 14, range: '필름공급부', part: 'Suction이상(하부)', standard: '기포발생시교체', method: '육안' },
  { no: 15, range: '이물질방지', part: '1차Metal(상부)', standard: '이물질없을것', method: '육안' },
  { no: 16, range: '이물질방지', part: '1차Metal(하부)', standard: '이물질없을것', method: '육안' },
  { no: 17, range: '이물질방지', part: '1차Metal(상부)', standard: '이물질없을것', method: '육안' },
  { no: 18, range: '이물질방지', part: '1차Metal(하부)', standard: '이물질없을것', method: '육안' },
] as const;

interface InspRow {
  id?: number;
  equipId?: number;
  inspectDate?: string;
  inspector?: string;
  status?: string;
  remark?: string;
}

interface ResultRow {
  itemNo: number;
  resultCode: string;
  note: string;
}

export default function EquipInspectionPage() {
  const { t } = useTranslation();
  const perm = usePermission('ET0020');
  const { notify } = useToast();
  const { confirm: confirmDialog, ConfirmDialog } = useConfirm();
  const codes = useCommonCodes('INSPECT_RESULT');
  const resultCodes = useMemo(() => codes['INSPECT_RESULT'] ?? [], [codes]);

  const [inspList, setInspList] = useState<InspRow[]>([]);
  const [selectedInsp, setSelectedInsp] = useState<InspRow | null>(null);
  const [results, setResults] = useState<ResultRow[]>([]);
  const [equipList, setEquipList] = useState<{ id: number; label: string }[]>([]);

  const equipListRef = useRef(equipList);
  equipListRef.current = equipList;
  const gridRef = useRef<AgGridReact<InspRow>>(null);

  const [showForm, setShowForm] = useState(false);
  const [newInsp, setNewInsp] = useState<Partial<InspRow>>({
    inspectDate: new Date().toISOString().split('T')[0],
    status: 'PENDING',
  });

  const fetchInsp = useCallback(async () => {
    try {
      const res = await authFetch('/api/et/inspection');
      if (res.ok) {
        const json = await res.json();
        setInspList(json.data?.content || []);
      }
    } catch {
      notify(t('message.networkError', '정기검사 조회에 실패했습니다'), { type: 'error' });
    }
  }, [notify, t]);

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

  const fetchResults = useCallback(async (id: number) => {
    try {
      const res = await authFetch(`/api/et/inspection/${id}/results`);
      if (res.ok) {
        const json = await res.json();
        const savedResults: { itemNo: number; resultCode?: string; note?: string }[] = json.data || [];
        const merged: ResultRow[] = INSPECTION_ITEMS.map(item => {
          const saved = savedResults.find(r => r.itemNo === item.no);
          return { itemNo: item.no, resultCode: saved?.resultCode || '', note: saved?.note || '' };
        });
        setResults(merged);
      }
    } catch {
      notify(t('message.networkError', '검사 결과 조회에 실패했습니다'), { type: 'error' });
    }
  }, [notify, t]);

  useEffect(() => { fetchInsp(); fetchEquip(); }, [fetchInsp, fetchEquip]);

  const handleSelectInsp = (row: InspRow) => {
    setSelectedInsp(row);
    if (row.id) fetchResults(row.id);
    else setResults([]);
  };

  const handleSaveResults = useCallback(async () => {
    if (!selectedInsp?.id) return;
    try {
      const res = await authFetch(`/api/et/inspection/${selectedInsp.id}/results/batch`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(results),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({ message: '서버 응답을 처리할 수 없습니다' }));
        throw new Error(err?.message || '저장에 실패했습니다');
      }
      notify(t('message.saveSuccess', '검사 결과를 저장했습니다'), { type: 'success' });
      await fetchInsp();
    } catch (e) {
      notify(e instanceof Error ? e.message : t('message.saveFailed', '저장에 실패했습니다'), { type: 'error' });
    }
  }, [selectedInsp, results, fetchInsp, notify, t]);

  const handleCreateInsp = useCallback(async () => {
    if (!newInsp.inspectDate) {
      notify('검사일자를 입력해주세요', { type: 'error' });
      return;
    }
    try {
      const res = await authFetch('/api/et/inspection', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newInsp),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({ message: '서버 응답을 처리할 수 없습니다' }));
        throw new Error(err?.message || '등록에 실패했습니다');
      }
      notify(t('message.saveSuccess', '검사 일정을 등록했습니다'), { type: 'success' });
      setShowForm(false);
      setNewInsp({ inspectDate: new Date().toISOString().split('T')[0], status: 'PENDING' });
      await fetchInsp();
    } catch (e) {
      notify(e instanceof Error ? e.message : t('message.saveFailed', '등록에 실패했습니다'), { type: 'error' });
    }
  }, [newInsp, fetchInsp, notify, t]);

  const handleDeleteInsp = useCallback(async () => {
    if (!selectedInsp?.id) return;
    if (!await confirmDialog(`${selectedInsp.inspectDate} 검사 일정을 삭제하시겠습니까?`)) return;
    try {
      const res = await authFetch(`/api/et/inspection/${selectedInsp.id}`, { method: 'DELETE' });
      if (!res.ok) {
        const err = await res.json().catch(() => ({ message: '서버 응답을 처리할 수 없습니다' }));
        throw new Error(err?.message || '삭제에 실패했습니다');
      }
      notify(t('message.deleteSuccess', '삭제되었습니다'), { type: 'success' });
      setSelectedInsp(null);
      setResults([]);
      await fetchInsp();
    } catch (e) {
      notify(e instanceof Error ? e.message : t('message.deleteFailed', '삭제에 실패했습니다'), { type: 'error' });
    }
  }, [selectedInsp, confirmDialog, fetchInsp, notify, t]);

  const inspColumns: ColDef<InspRow>[] = useMemo(() => [
    { field: 'inspectDate', headerName: '검사일자', width: 120 },
    { field: 'equipId', headerName: '설비', width: 140, valueFormatter: (p) => {
      const eq = equipListRef.current.find(e => e.id === p.value);
      return eq ? eq.label : String(p.value ?? '');
    }},
    { field: 'inspector', headerName: '검사자', width: 100 },
    { field: 'status', headerName: '상태', width: 90,
      valueFormatter: (p) => p.value === 'COMPLETED' ? '완료' : '진행중',
      cellStyle: (p) => p.value === 'COMPLETED' ? { color: '#22c55e', fontWeight: 600 } : {},
    },
    { field: 'remark', headerName: '비고', flex: 1 },
  ], []);

  useEffect(() => {
    gridRef.current?.api?.refreshCells({ force: true });
  }, [equipList]);

  const thStyle: React.CSSProperties = {
    textAlign: 'right', padding: '6px 8px', whiteSpace: 'nowrap',
    color: 'var(--color-text-disabled)', fontSize: 13, verticalAlign: 'top',
  };

  return (
    <>
      <PageFilterShell
        title={t('menu.ET0020')}
        toolbarRight={
          <>
            {perm.canDelete && selectedInsp && (
              <button className="mes-btn mes-btn-delete" onClick={handleDeleteInsp}>삭제</button>
            )}
            {perm.canCreate && (
              <button className="mes-btn mes-btn-save" onClick={() => setShowForm(true)}>신규 일정</button>
            )}
          </>
        }
      >
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 8, overflow: 'hidden', padding: '0 0 8px' }}>
        {/* 상단: 검사 일정 목록 */}
        <div style={{ flex: '0 0 40%', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
          <div style={{ fontSize: 12, fontWeight: 600, padding: '4px 0', color: 'var(--color-text-secondary)' }}>
            정기검사 일정
          </div>
          <div className="ag-theme-mes" style={{ flex: 1 }}>
            <AgGridReact
              ref={gridRef}
              rowData={inspList}
              columnDefs={inspColumns}
              rowSelection="single"
              onRowClicked={e => e.data && handleSelectInsp(e.data)}
              defaultColDef={{ resizable: true, sortable: true }}
            />
          </div>
        </div>

        {/* 하단: 검사 항목 결과 */}
        <div style={{ flex: 1, overflow: 'auto', border: '1px solid var(--color-border)', borderRadius: 4 }}>
          {selectedInsp ? (
            <>
              <div style={{ display: 'flex', alignItems: 'center', padding: '8px 12px', borderBottom: '1px solid var(--color-border)', gap: 8 }}>
                <span style={{ fontSize: 13, fontWeight: 600 }}>
                  검사항목 -- {selectedInsp.inspectDate}{' '}
                  {equipList.find(e => e.id === selectedInsp.equipId)?.label ?? ''}
                </span>
                {perm.canUpdate && (
                  <button className="mes-btn mes-btn-save" style={{ marginLeft: 'auto' }} onClick={handleSaveResults}>
                    결과 저장
                  </button>
                )}
              </div>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
                <thead>
                  <tr style={{ background: 'var(--grid-header-bg, #f0f4f8)' }}>
                    <th style={{ padding: '6px 8px', borderBottom: '1px solid var(--color-border)', width: 40 }}>NO</th>
                    <th style={{ padding: '6px 8px', borderBottom: '1px solid var(--color-border)', width: 100 }}>점검범위</th>
                    <th style={{ padding: '6px 8px', borderBottom: '1px solid var(--color-border)', width: 150 }}>점검부위</th>
                    <th style={{ padding: '6px 8px', borderBottom: '1px solid var(--color-border)', width: 180 }}>점검기준</th>
                    <th style={{ padding: '6px 8px', borderBottom: '1px solid var(--color-border)', width: 120 }}>점검방법</th>
                    <th style={{ padding: '6px 8px', borderBottom: '1px solid var(--color-border)', width: 120 }}>결과</th>
                    <th style={{ padding: '6px 8px', borderBottom: '1px solid var(--color-border)' }}>비고</th>
                  </tr>
                </thead>
                <tbody>
                  {INSPECTION_ITEMS.map((item) => {
                    const result = results.find(r => r.itemNo === item.no) ?? { itemNo: item.no, resultCode: '', note: '' };
                    return (
                      <tr key={item.no} style={{ borderBottom: '1px solid var(--color-border)' }}>
                        <td style={{ padding: '4px 8px', textAlign: 'center' }}>{item.no}</td>
                        <td style={{ padding: '4px 8px' }}>{item.range}</td>
                        <td style={{ padding: '4px 8px' }}>{item.part}</td>
                        <td style={{ padding: '4px 8px', fontSize: 12 }}>{item.standard}</td>
                        <td style={{ padding: '4px 8px', fontSize: 12 }}>{item.method}</td>
                        <td style={{ padding: '4px 4px' }}>
                          <select
                            value={result.resultCode}
                            disabled={!perm.canUpdate}
                            onChange={e => setResults(prev =>
                              prev.map(r => r.itemNo === item.no ? { ...r, resultCode: e.target.value } : r)
                            )}
                            style={{ width: '100%', padding: '2px 4px' }}
                          >
                            <option value="">--</option>
                            {resultCodes.map((c: CommonCode) => (
                              <option key={c.code} value={c.code}>{c.codeName}</option>
                            ))}
                          </select>
                        </td>
                        <td style={{ padding: '4px 4px' }}>
                          <input
                            value={result.note}
                            disabled={!perm.canUpdate}
                            onChange={e => setResults(prev =>
                              prev.map(r => r.itemNo === item.no ? { ...r, note: e.target.value } : r)
                            )}
                            style={{ width: '100%', padding: '2px 4px' }}
                          />
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </>
          ) : (
            <div style={{ padding: 32, textAlign: 'center', color: 'var(--color-text-disabled)' }}>
              위 목록에서 검사 일정을 선택하세요
            </div>
          )}
        </div>
        </div>
      </PageFilterShell>

      <Modal open={showForm} onClose={() => setShowForm(false)} title="검사 일정 등록" width={420}>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <tbody>
            <tr>
              <th style={thStyle}>설비</th>
              <td style={{ padding: '4px 8px' }}>
                <select
                  value={newInsp.equipId ?? ''}
                  onChange={e => setNewInsp(r => ({ ...r, equipId: e.target.value ? +e.target.value : undefined }))}
                  style={{ width: '100%' }}
                >
                  <option value="">-- 선택 --</option>
                  {equipList.map(eq => <option key={eq.id} value={eq.id}>{eq.label}</option>)}
                </select>
              </td>
            </tr>
            <tr>
              <th style={thStyle}>검사일자</th>
              <td style={{ padding: '4px 8px' }}>
                <input
                  type="date"
                  value={newInsp.inspectDate ?? ''}
                  onChange={e => setNewInsp(r => ({ ...r, inspectDate: e.target.value }))}
                  style={{ width: '100%' }}
                />
              </td>
            </tr>
            <tr>
              <th style={thStyle}>검사자</th>
              <td style={{ padding: '4px 8px' }}>
                <input
                  value={newInsp.inspector ?? ''}
                  onChange={e => setNewInsp(r => ({ ...r, inspector: e.target.value }))}
                  style={{ width: '100%' }}
                />
              </td>
            </tr>
            <tr>
              <th style={thStyle}>비고</th>
              <td style={{ padding: '4px 8px' }}>
                <input
                  value={newInsp.remark ?? ''}
                  onChange={e => setNewInsp(r => ({ ...r, remark: e.target.value }))}
                  style={{ width: '100%' }}
                />
              </td>
            </tr>
          </tbody>
        </table>
        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8, marginTop: 16 }}>
          <button className="mes-btn" onClick={() => setShowForm(false)}>취소</button>
          <button className="mes-btn mes-btn-save" onClick={handleCreateInsp}>등록</button>
        </div>
      </Modal>

      <ConfirmDialog />
    </>
  );
}
