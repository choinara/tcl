import { useState, useCallback, useEffect, useRef, useMemo } from 'react';
import { Modal } from '@/components/ui/Modal';
import { FormField } from '@/components/ui/FormField';
import { authFetch } from '@/lib/api';
import { usePermission } from '@/hooks/usePermission';
import { PageTitle } from '@/components/ui/PageTitle';
import { PeakEditGrid } from '@/components/grid';
import type { PeakEditGridRef } from '@/components/grid';
import type { ColDef } from 'ag-grid-community';
import { useToast } from '@/shared/components/toast/useToast';
import { useConfirm } from '@/components/ui/ConfirmDialog';

/* ── Types ── */

interface CodeGroup {
  id: number;
  groupCode: string;
  groupName: string;
  description: string;
  useYn: string;
  sortOrder: number;
  extra1Label: string | null;
  extra2Label: string | null;
}

interface Code {
  id: number;
  groupId: number;
  code: string;
  codeName: string;
  codeDesc: string;
  useYn: string;
  sortOrder: number;
  extra1: string;
  extra2: string;
}

interface GroupForm {
  groupCode: string;
  groupName: string;
  description: string;
  sortOrder: string;
  extra1Label: string;
  extra2Label: string;
}

const emptyGroupForm: GroupForm = {
  groupCode: '', groupName: '', description: '', sortOrder: '0',
  extra1Label: '', extra2Label: '',
};

const STORAGE_KEY_SELECTED_GROUP = 'common-code:selected-group-code';

/* ── Component ── */

export default function CommonCodePage() {
  const perm = usePermission('SM0090');
  const { notify } = useToast();
  const { confirm: confirmDialog, ConfirmDialog } = useConfirm();
  const editGridRef = useRef<PeakEditGridRef>(null);

  // ── Group state ──
  const [groups, setGroups] = useState<CodeGroup[]>([]);
  const [selectedGroup, setSelectedGroup] = useState<CodeGroup | null>(null);
  const [groupModalOpen, setGroupModalOpen] = useState(false);
  const [editingGroup, setEditingGroup] = useState<CodeGroup | null>(null);
  const [groupForm, setGroupForm] = useState<GroupForm>(emptyGroupForm);
  const [groupSearch, setGroupSearch] = useState('');
  const [savingGroup, setSavingGroup] = useState(false);
  const [groupErrors, setGroupErrors] = useState<Record<string, string>>({});

  // ── Code state ──
  const [codes, setCodes] = useState<Code[]>([]);
  const [showAllCodes, setShowAllCodes] = useState(false);

  // ── Fetch groups ──
  const fetchGroups = useCallback(async () => {
    try {
      const res = await authFetch('/api/common-codes/groups');
      if (res.ok) {
        const json = await res.json();
        setGroups(json.data || []);
      }
    } catch {
      notify('공통코드 조회에 실패했습니다', { type: 'error' });
    }
  }, [notify]);

  useEffect(() => { fetchGroups(); }, [fetchGroups]);

  // ── Fetch codes by group ──
  const fetchCodes = useCallback(async (groupId: number) => {
    try {
      const res = await authFetch(`/api/common-codes/by-group-id/${groupId}`);
      if (res.ok) {
        const json = await res.json();
        setCodes(json.data || []);
      }
    } catch {
      notify('공통코드 조회에 실패했습니다', { type: 'error' });
    }
  }, [notify]);

  const handleSelectGroup = useCallback((group: CodeGroup) => {
    setSelectedGroup(group);
    sessionStorage.setItem(STORAGE_KEY_SELECTED_GROUP, group.groupCode);
    fetchCodes(group.id);
  }, [fetchCodes]);

  // 탭 이동/새로고침 후 복귀 시 마지막 선택 그룹 복원
  useEffect(() => {
    if (selectedGroup || groups.length === 0) return;
    const savedCode = sessionStorage.getItem(STORAGE_KEY_SELECTED_GROUP);
    if (!savedCode) return;
    const found = groups.find(g => g.groupCode === savedCode);
    if (found) {
      setSelectedGroup(found);
      fetchCodes(found.id);
    } else {
      sessionStorage.removeItem(STORAGE_KEY_SELECTED_GROUP);
    }
  }, [groups, selectedGroup, fetchCodes]);

  // ── Validation ──
  const validateGroup = useCallback((): boolean => {
    const newErrors: Record<string, string> = {};
    if (!groupForm.groupCode.trim()) newErrors.groupCode = '그룹코드를 입력하세요.';
    if (!groupForm.groupName.trim()) newErrors.groupName = '그룹명을 입력하세요.';
    setGroupErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }, [groupForm]);

  // ── Group CRUD ──
  const handleNewGroup = useCallback(() => {
    setEditingGroup(null);
    setGroupForm(emptyGroupForm);
    setGroupErrors({});
    setGroupModalOpen(true);
  }, []);

  const handleEditGroup = useCallback((group: CodeGroup) => {
    setEditingGroup(group);
    setGroupForm({
      groupCode: group.groupCode,
      groupName: group.groupName,
      description: group.description || '',
      sortOrder: String(group.sortOrder ?? 0),
      extra1Label: group.extra1Label || '',
      extra2Label: group.extra2Label || '',
    });
    setGroupErrors({});
    setGroupModalOpen(true);
  }, []);

  const handleSaveGroup = useCallback(async () => {
    if (!validateGroup()) return;
    setSavingGroup(true);
    try {
      const url = editingGroup ? `/api/common-codes/groups/${editingGroup.id}` : '/api/common-codes/groups';
      const method = editingGroup ? 'PUT' : 'POST';
      const body = {
        ...groupForm,
        sortOrder: Number(groupForm.sortOrder),
        extra1Label: groupForm.extra1Label.trim() || null,
        extra2Label: groupForm.extra2Label.trim() || null,
      };
      const res = await authFetch(url, { method, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
      if (!res.ok) { const err = await res.json().catch(() => ({ message: '서버 응답을 처리할 수 없습니다' })); throw new Error(err?.message || '요청 처리에 실패했습니다.'); }
      const savedJson = await res.json();
      const savedGroup = savedJson.data as CodeGroup;
      await fetchGroups();
      // 수정한 그룹이 현재 선택된 그룹이면 selectedGroup도 갱신 (라벨 반영)
      if (selectedGroup?.id === savedGroup.id) {
        setSelectedGroup(savedGroup);
      }
      setGroupModalOpen(false);
      notify(editingGroup ? '수정되었습니다' : '등록되었습니다', { type: 'success' });
    } catch (err) {
      notify('저장 실패: ' + (err instanceof Error ? err.message : String(err)), { type: 'error' });
    } finally { setSavingGroup(false); }
  }, [groupForm, editingGroup, fetchGroups, validateGroup, selectedGroup, notify]);

  const handleDeleteGroup = useCallback(async (group: CodeGroup) => {
    if (!await confirmDialog(`그룹 "${group.groupName}"을 삭제하시겠습니까?`)) return;
    try {
      const res = await authFetch(`/api/common-codes/groups/${group.id}`, { method: 'DELETE' });
      if (!res.ok) { const err = await res.json().catch(() => ({ message: '서버 응답을 처리할 수 없습니다' })); throw new Error(err?.message || '요청 처리에 실패했습니다.'); }
      await fetchGroups();
      if (selectedGroup?.id === group.id) {
        setSelectedGroup(null);
        setCodes([]);
        sessionStorage.removeItem(STORAGE_KEY_SELECTED_GROUP);
      }
      notify('삭제되었습니다', { type: 'success' });
    } catch (err) {
      notify('삭제 실패: ' + (err instanceof Error ? err.message : String(err)), { type: 'error' });
    }
  }, [fetchGroups, selectedGroup, notify, confirmDialog]);

  // ── EditGrid batch save ──
  const handleBatchSave = useCallback(async (rows: { _rowState: string; [key: string]: unknown }[]) => {
    if (!selectedGroup) return;
    const res = await authFetch(`/api/common-codes/batch/${selectedGroup.id}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(rows),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({ message: '서버 응답을 처리할 수 없습니다' }));
      throw new Error(err?.message || '요청 처리에 실패했습니다.');
    }
    await fetchCodes(selectedGroup.id);
    notify('일괄 저장되었습니다', { type: 'success' });
  }, [selectedGroup, fetchCodes, notify]);

  // ── EditGrid columns (동적 Extra 라벨) ──
  const codeColumns = useMemo(() => {
    const extra1Header = selectedGroup?.extra1Label || 'Extra1';
    const extra2Header = selectedGroup?.extra2Label || 'Extra2';

    return [
      { field: 'code', headerName: '코드', width: 120, editable: (params) => !params.data?.id },
      { field: 'codeName', headerName: '코드명', width: 150, editable: true },
      { field: 'codeDesc', headerName: '설명', flex: 1, editable: true },
      { field: 'sortOrder', headerName: '정렬', width: 70, editable: true, cellDataType: 'number' },
      { field: 'extra1', headerName: extra1Header, width: 100, editable: true },
      { field: 'extra2', headerName: extra2Header, width: 100, editable: true },
      {
        field: 'useYn', headerName: '사용', width: 80, editable: true,
        cellEditor: 'agSelectCellEditor',
        cellEditorParams: { values: ['Y', 'N'] },
        valueFormatter: (params) => params.value === 'Y' ? '사용' : '미사용',
        cellStyle: (params) => params.value === 'N' ? { textAlign: 'center', color: '#94a3b8' } : { textAlign: 'center' },
      },
    ] as ColDef<any>[];
  }, [selectedGroup?.extra1Label, selectedGroup?.extra2Label]);

  // ── EditGrid data (Code[] → Record[]) ──
  const codeData = useMemo<Record<string, unknown>[]>(() => {
    const filtered = showAllCodes ? codes : codes.filter(c => c.useYn === 'Y');
    return filtered.map(c => ({ ...c }));
  }, [codes, showAllCodes]);

  // ── Filter groups ──
  const filteredGroups = groupSearch
    ? groups.filter(g => g.groupCode.toLowerCase().includes(groupSearch.toLowerCase()) || g.groupName.includes(groupSearch))
    : groups;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      <div className="grid-toolbar">
        <PageTitle />
      </div>

      <div style={{ display: 'flex', gap: 16, flex: 1, overflow: 'hidden', marginTop: 8 }}>
        {/* ── 좌측: 그룹 목록 ── */}
        <div style={{ width: 340, flexShrink: 0, display: 'flex', flexDirection: 'column', border: '1px solid var(--color-border)', borderRadius: 6, overflow: 'hidden' }}>
          <div style={{ padding: '8px 12px', borderBottom: '1px solid var(--color-border)', display: 'flex', alignItems: 'center', gap: 8, background: '#f8fafc' }}>
            <input
              type="text"
              value={groupSearch}
              onChange={e => setGroupSearch(e.target.value)}
              placeholder="그룹 검색..."
              style={{ flex: 1, padding: '3px 8px', border: '1px solid #d1d5db', borderRadius: 4, fontSize: 12 }}
            />
            {perm.canCreate && (
              <button className="mes-btn mes-btn-new" style={{ fontSize: 11, padding: '2px 8px' }} onClick={handleNewGroup}>
                추가
              </button>
            )}
          </div>
          <div style={{ flex: 1, overflow: 'auto' }}>
            {filteredGroups.map(group => (
              <div
                key={group.id}
                onClick={() => handleSelectGroup(group)}
                style={{
                  padding: '8px 12px',
                  cursor: 'pointer',
                  borderBottom: '1px solid #f1f5f9',
                  background: selectedGroup?.id === group.id ? '#e0f2fe' : 'transparent',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                }}
              >
                <div>
                  <div style={{ fontSize: 13, fontWeight: 500 }}>{group.groupName}</div>
                  <div style={{ fontSize: 11, color: '#94a3b8' }}>{group.groupCode}</div>
                </div>
                <div style={{ display: 'flex', gap: 4 }}>
                  {perm.canUpdate && (
                    <button
                      className="mes-btn mes-btn-edit"
                      style={{ fontSize: 10, padding: '1px 6px' }}
                      onClick={e => { e.stopPropagation(); handleEditGroup(group); }}
                    >
                      수정
                    </button>
                  )}
                  {perm.canDelete && (
                    <button
                      className="mes-btn mes-btn-delete"
                      style={{ fontSize: 10, padding: '1px 6px' }}
                      onClick={e => { e.stopPropagation(); handleDeleteGroup(group); }}
                    >
                      삭제
                    </button>
                  )}
                </div>
              </div>
            ))}
            {!filteredGroups.length && (
              <div style={{ padding: 20, textAlign: 'center', color: '#94a3b8', fontSize: 13 }}>
                {groupSearch ? '검색 결과 없음' : '등록된 그룹이 없습니다'}
              </div>
            )}
          </div>
        </div>

        {/* ── 우측: 코드 목록 (PeakEditGrid) ── */}
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
          <div style={{ padding: '8px 0 4px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <span style={{ fontSize: 'var(--font-size-base)', fontWeight: 600 }}>
              {selectedGroup ? `${selectedGroup.groupName} (${selectedGroup.groupCode})` : '그룹을 선택하세요'}
            </span>
            {selectedGroup && (
              <label style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 12, cursor: 'pointer', color: '#64748b' }}>
                <input type="checkbox" checked={showAllCodes} onChange={(e) => setShowAllCodes(e.target.checked)} style={{ accentColor: '#6ba3f7' }} />
                전체보기 (미사용 포함)
              </label>
            )}
          </div>
          {selectedGroup ? (
            <PeakEditGrid
              ref={editGridRef}
              gridId={`common-code-${selectedGroup.id}`}
              columns={codeColumns}
              data={codeData}
              bodyHeight="fitToParent"
              onBatchSave={handleBatchSave}
              permission={perm}
            />
          ) : (
            <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', border: '1px solid var(--color-border)', borderRadius: 6, color: '#94a3b8', fontSize: 13 }}>
              좌측에서 그룹을 선택하면 코드 목록이 표시됩니다
            </div>
          )}
        </div>
      </div>

      {/* ── 그룹 모달 ── */}
      <Modal open={groupModalOpen} onClose={() => setGroupModalOpen(false)} title={editingGroup ? '그룹 수정' : '그룹 등록'}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0 40px' }}>
          <FormField label="그룹코드" required value={groupForm.groupCode} onChange={e => setGroupForm(p => ({ ...p, groupCode: e.target.value.toUpperCase() }))}
            placeholder="DEPT_CODE, POS_LEVEL, ..." disabled={!!editingGroup} error={groupErrors.groupCode} />
          <FormField label="그룹명" required value={groupForm.groupName} onChange={e => setGroupForm(p => ({ ...p, groupName: e.target.value }))}
            placeholder="부서코드, 직급레벨, ..." error={groupErrors.groupName} />
          <div style={{ gridColumn: '1 / -1' }}>
            <FormField label="설명" value={groupForm.description} onChange={e => setGroupForm(p => ({ ...p, description: e.target.value }))}
              placeholder="그룹 설명" />
          </div>
          <FormField label="Extra1 컬럼명" value={groupForm.extra1Label} onChange={e => setGroupForm(p => ({ ...p, extra1Label: e.target.value }))}
            placeholder="미입력 시 'Extra1'로 표시" />
          <FormField label="Extra2 컬럼명" value={groupForm.extra2Label} onChange={e => setGroupForm(p => ({ ...p, extra2Label: e.target.value }))}
            placeholder="미입력 시 'Extra2'로 표시" />
        </div>
        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8, marginTop: 16 }}>
          <button onClick={() => setGroupModalOpen(false)}
            style={{ padding: '6px 16px', border: '1px solid #d1d5db', borderRadius: 4, background: '#fff', cursor: 'pointer', fontSize: 14 }}>
            취소
          </button>
          <button onClick={handleSaveGroup} disabled={savingGroup}
            className="mes-btn mes-btn-save" style={{ padding: '6px 16px', fontSize: 14, opacity: savingGroup ? 0.6 : 1 }}>
            {savingGroup ? '저장 중...' : '저장'}
          </button>
        </div>
      </Modal>
      <ConfirmDialog />
    </div>
  );
}
