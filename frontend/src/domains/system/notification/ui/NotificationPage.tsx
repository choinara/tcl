import { useState, useCallback, useMemo } from 'react';
import type { ColDef } from 'ag-grid-community';
import { PeakDataGrid } from '@/components/grid/PeakDataGrid';
import { FormField } from '@/components/ui/FormField';
import { Modal } from '@/components/ui/Modal';
import { authFetch } from '@/lib/api';
import { PageTitle } from '@/components/ui/PageTitle';
import { usePermission } from '@/hooks/usePermission';
import type { PermissionSet } from '@/stores/useAuthStore';
import { useToast } from '@/shared/components/toast/useToast';
import { useConfirm } from '@/components/ui/ConfirmDialog';

/* -- Types -- */

interface Notification {
  id: number;
  message: string;
  active: boolean;
  startAt: string | null;
  endAt: string | null;
  createdBy: string;
  createdAt: string;
}

interface Bulletin {
  id: number;
  title: string;
  content: string;
  popupOnLogin: boolean;
  validFrom: string;
  validTo: string;
  active: boolean;
  createdBy: string;
  createdAt: string;
}

interface NotificationForm {
  message: string;
  startAt: string;
  endAt: string;
}

interface BulletinForm {
  title: string;
  content: string;
  popupOnLogin: boolean;
  validFrom: string;
  validTo: string;
  active: boolean;
}

const emptyNotifForm: NotificationForm = { message: '', startAt: '', endAt: '' };
const emptyBulletinForm: BulletinForm = { title: '', content: '', popupOnLogin: true, validFrom: '', validTo: '', active: true };

type Tab = 'notification' | 'bulletin';

export default function NotificationPage() {
  const perm = usePermission('SM0070');
  const [activeTab, setActiveTab] = useState<Tab>('notification');

  return (
    <div>
      <div className="grid-toolbar">
        <PageTitle />
      </div>

      {/* Tab selector */}
      <div style={{ display: 'flex', gap: 0, marginBottom: 16, borderBottom: '2px solid #e2e8f0' }}>
        <button
          onClick={() => setActiveTab('notification')}
          style={{
            padding: '8px 20px', fontSize: 13, fontWeight: activeTab === 'notification' ? 600 : 400,
            border: 'none', borderBottom: activeTab === 'notification' ? '2px solid #2563eb' : '2px solid transparent',
            background: 'transparent', cursor: 'pointer', marginBottom: -2,
            color: activeTab === 'notification' ? '#2563eb' : '#64748b',
          }}
        >
          {'알림 메시지'}
        </button>
        <button
          onClick={() => setActiveTab('bulletin')}
          style={{
            padding: '8px 20px', fontSize: 13, fontWeight: activeTab === 'bulletin' ? 600 : 400,
            border: 'none', borderBottom: activeTab === 'bulletin' ? '2px solid #2563eb' : '2px solid transparent',
            background: 'transparent', cursor: 'pointer', marginBottom: -2,
            color: activeTab === 'bulletin' ? '#2563eb' : '#64748b',
          }}
        >
          {'게시판'}
        </button>
      </div>

      {activeTab === 'notification'
        ? <NotificationTab perm={perm} />
        : <BulletinTab perm={perm} />
      }
    </div>
  );
}

/* ===================================================================
   알림 메시지 탭
   =================================================================== */

function NotificationTab({ perm }: { perm: PermissionSet & { loading: boolean } }) {
  const { notify } = useToast();
  const { confirm: confirmDialog, ConfirmDialog } = useConfirm();
  const [modalOpen, setModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [form, setForm] = useState<NotificationForm>(emptyNotifForm);
  const [saving, setSaving] = useState(false);
  const [refetchTrigger, setRefetchTrigger] = useState(0);

  const columns = useMemo<ColDef<Notification>[]>(() => [
    { field: 'id', headerName: 'ID', width: 70 },
    { field: 'message', headerName: '알림 내용', flex: 1, minWidth: 200 },
    {
      field: 'startAt', headerName: '시작일시', width: 150,
      valueFormatter: (p) => p.value ? String(p.value).replace('T', ' ').slice(0, 16) : '-',
    },
    {
      field: 'endAt', headerName: '종료일시', width: 150,
      valueFormatter: (p) => p.value ? String(p.value).replace('T', ' ').slice(0, 16) : '-',
    },
    { field: 'createdBy', headerName: '등록', width: 100 },
  ], []);

  const handleRowClick = useCallback((row: Notification) => {
    setEditingId(row.id);
    setForm({
      message: row.message,
      startAt: row.startAt ? row.startAt.slice(0, 16) : '',
      endAt: row.endAt ? row.endAt.slice(0, 16) : '',
    });
    setModalOpen(true);
  }, []);

  const handleNew = useCallback(() => {
    setEditingId(null);
    setForm(emptyNotifForm);
    setModalOpen(true);
  }, []);

  const handleSave = useCallback(async () => {
    if (!form.message.trim()) { notify('알림 내용 필수', { type: 'warning' }); return; }
    if (form.message.length > 300) { notify('최대 300자', { type: 'warning' }); return; }
    setSaving(true);
    try {
      const url = editingId ? `/api/system/notifications/${editingId}` : '/api/system/notifications';
      const method = editingId ? 'PUT' : 'POST';
      const body = {
        message: form.message,
        active: true,
        startAt: form.startAt || null,
        endAt: form.endAt || null,
      };
      const res = await authFetch(url, { method, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
      if (!res.ok) { const err = await res.json().catch(() => null); throw new Error(err?.message || '요청 처리에 실패했습니다.'); }
      setRefetchTrigger(prev => prev + 1);
      setModalOpen(false);
      notify(editingId ? '수정되었습니다' : '등록되었습니다', { type: 'success' });
    } catch (err) {
      notify('저장에 실패했습니다: ' + (err instanceof Error ? err.message : String(err)), { type: 'error' });
    } finally { setSaving(false); }
  }, [form, editingId, notify]);

  const handleDelete = useCallback(async () => {
    if (!editingId) return;
    if (!await confirmDialog('삭제하시겠습니까?')) return;
    try {
      const res = await authFetch(`/api/system/notifications/${editingId}`, { method: 'DELETE' });
      if (!res.ok) { const err = await res.json().catch(() => null); throw new Error(err?.message || '요청 처리에 실패했습니다.'); }
      setRefetchTrigger(prev => prev + 1);
      setModalOpen(false);
      notify('삭제되었습니다', { type: 'success' });
    } catch (err) {
      notify('삭제에 실패했습니다: ' + (err instanceof Error ? err.message : String(err)), { type: 'error' });
    }
  }, [editingId, notify, confirmDialog]);

  return (
    <>
      <PeakDataGrid<Notification>
        columns={columns}
        queryKey={['system-notifications']}
        queryUrl="/system/notifications"
        pageSize={20}
        onRowClick={handleRowClick}
        refetchTrigger={refetchTrigger}
        permission={{ canExport: perm.canExport }}
        toolbarLeft={
          perm.canCreate ? (
            <button className="mes-btn mes-btn-new" onClick={handleNew}>
              {'알림 등록'}
            </button>
          ) : undefined
        }
      />

      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title={editingId ? '알림 수정' : '알림 등록'}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0 40px' }}>
          <div style={{ gridColumn: '1 / -1', marginBottom: 12 }}>
            <label style={{ display: 'block', fontWeight: 500, fontSize: 13, marginBottom: 4 }}>
              알림 내용 <span style={{ color: '#ef4444' }}>*</span>
            </label>
            <textarea
              value={form.message}
              onChange={e => setForm(prev => ({ ...prev, message: e.target.value }))}
              rows={4}
              style={{ width: '100%', padding: '6px 8px', border: '1px solid #d1d5db', borderRadius: 4, fontSize: 13, resize: 'vertical' }}
              placeholder="최대 300자"
            />
            <div style={{ textAlign: 'right', fontSize: 11, color: form.message.length > 300 ? '#ef4444' : '#94a3b8' }}>
              {form.message.length}/300
              {form.message.length > 300 && <span style={{ marginLeft: 4 }}>최대 300자</span>}
            </div>
          </div>
          <FormField label="시작일시" type="datetime-local" value={form.startAt} onChange={e => setForm(prev => ({ ...prev, startAt: e.target.value }))} />
          <FormField label="종료일시" type="datetime-local" value={form.endAt} onChange={e => setForm(prev => ({ ...prev, endAt: e.target.value }))} />
        </div>
        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8, marginTop: 16 }}>
          {editingId && perm.canDelete && (
            <button onClick={handleDelete} className="mes-btn mes-btn-delete" style={{ padding: '6px 16px', fontSize: 14, marginRight: 'auto' }}>
              삭제
            </button>
          )}
          <button onClick={() => setModalOpen(false)} style={{ padding: '6px 16px', border: '1px solid #d1d5db', borderRadius: 4, background: '#fff', cursor: 'pointer', fontSize: 14 }}>취소</button>
          {perm.canUpdate && (
            <button onClick={handleSave} disabled={saving} className="mes-btn mes-btn-save" style={{ padding: '6px 16px', fontSize: 14, opacity: saving ? 0.6 : 1 }}>
              {saving ? '저장 중...' : '저장'}
            </button>
          )}
        </div>
      </Modal>
      <ConfirmDialog />
    </>
  );
}

/* ===================================================================
   게시판 탭
   =================================================================== */

function BulletinTab({ perm }: { perm: PermissionSet & { loading: boolean } }) {
  const { notify } = useToast();
  const { confirm: confirmDialog, ConfirmDialog: ConfirmDialogBulletin } = useConfirm();
  const [modalOpen, setModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [form, setForm] = useState<BulletinForm>(emptyBulletinForm);
  const [saving, setSaving] = useState(false);
  const [refetchTrigger, setRefetchTrigger] = useState(0);

  const columns = useMemo<ColDef<Bulletin>[]>(() => [
    { field: 'id', headerName: 'ID', width: 70 },
    { field: 'title', headerName: '제목', flex: 1, minWidth: 200 },
    {
      field: 'popupOnLogin', headerName: '로그인 시 팝업', width: 120,
      valueFormatter: (p) => p.value ? 'O' : '-',
    },
    { field: 'validFrom', headerName: '유효기간 시작', width: 120 },
    { field: 'validTo', headerName: '유효기간 종료', width: 120 },
    {
      field: 'active', headerName: '활성', width: 80,
      valueFormatter: (p) => p.value ? '활성' : '비활성',
    },
    { field: 'createdBy', headerName: '등록', width: 100 },
  ], []);

  const handleRowClick = useCallback((row: Bulletin) => {
    setEditingId(row.id);
    setForm({
      title: row.title,
      content: row.content ?? '',
      popupOnLogin: row.popupOnLogin,
      validFrom: row.validFrom,
      validTo: row.validTo,
      active: row.active,
    });
    setModalOpen(true);
  }, []);

  const handleNew = useCallback(() => {
    setEditingId(null);
    setForm(emptyBulletinForm);
    setModalOpen(true);
  }, []);

  const handleSave = useCallback(async () => {
    if (!form.title.trim()) { notify('제목 필수', { type: 'warning' }); return; }
    if (!form.validFrom || !form.validTo) { notify('유효기간 시작 / 유효기간 종료 필수', { type: 'warning' }); return; }
    setSaving(true);
    try {
      const url = editingId ? `/api/system/bulletins/${editingId}` : '/api/system/bulletins';
      const method = editingId ? 'PUT' : 'POST';
      const res = await authFetch(url, { method, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(form) });
      if (!res.ok) { const err = await res.json().catch(() => null); throw new Error(err?.message || '요청 처리에 실패했습니다.'); }
      setRefetchTrigger(prev => prev + 1);
      setModalOpen(false);
      notify(editingId ? '수정되었습니다' : '등록되었습니다', { type: 'success' });
    } catch (err) {
      notify('저장에 실패했습니다: ' + (err instanceof Error ? err.message : String(err)), { type: 'error' });
    } finally { setSaving(false); }
  }, [form, editingId, notify]);

  const handleDelete = useCallback(async () => {
    if (!editingId) return;
    if (!await confirmDialog('삭제하시겠습니까?')) return;
    try {
      const res = await authFetch(`/api/system/bulletins/${editingId}`, { method: 'DELETE' });
      if (!res.ok) { const err = await res.json().catch(() => null); throw new Error(err?.message || '요청 처리에 실패했습니다.'); }
      setRefetchTrigger(prev => prev + 1);
      setModalOpen(false);
      notify('삭제되었습니다', { type: 'success' });
    } catch (err) {
      notify('삭제에 실패했습니다: ' + (err instanceof Error ? err.message : String(err)), { type: 'error' });
    }
  }, [editingId, notify, confirmDialog]);

  return (
    <>
      <PeakDataGrid<Bulletin>
        columns={columns}
        queryKey={['system-bulletins']}
        queryUrl="/system/bulletins"
        pageSize={20}
        onRowClick={handleRowClick}
        refetchTrigger={refetchTrigger}
        permission={{ canExport: perm.canExport }}
        toolbarLeft={
          perm.canCreate ? (
            <button className="mes-btn mes-btn-new" onClick={handleNew}>
              {'게시물 등록'}
            </button>
          ) : undefined
        }
      />

      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title={editingId ? '게시물 수정' : '게시물 등록'}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0 40px' }}>
          <div style={{ gridColumn: '1 / -1' }}>
            <FormField label="제목" required value={form.title} onChange={e => setForm(prev => ({ ...prev, title: e.target.value }))} maxLength={200} />
          </div>
          <div style={{ gridColumn: '1 / -1', marginBottom: 12 }}>
            <label style={{ display: 'block', fontWeight: 500, fontSize: 13, marginBottom: 4 }}>내용</label>
            <textarea
              value={form.content}
              onChange={e => setForm(prev => ({ ...prev, content: e.target.value }))}
              rows={6}
              style={{ width: '100%', padding: '6px 8px', border: '1px solid #d1d5db', borderRadius: 4, fontSize: 13, resize: 'vertical' }}
            />
          </div>
          <FormField label="유효기간 시작" required type="date" value={form.validFrom} onChange={e => setForm(prev => ({ ...prev, validFrom: e.target.value }))} />
          <FormField label="유효기간 종료" required type="date" value={form.validTo} onChange={e => setForm(prev => ({ ...prev, validTo: e.target.value }))} />
          <div style={{ gridColumn: '1 / -1', display: 'flex', gap: 16, marginTop: 4 }}>
            <label style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 13 }}>
              <input type="checkbox" checked={form.popupOnLogin} onChange={e => setForm(prev => ({ ...prev, popupOnLogin: e.target.checked }))} />
              로그인 시 팝업
            </label>
            <label style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 13 }}>
              <input type="checkbox" checked={form.active} onChange={e => setForm(prev => ({ ...prev, active: e.target.checked }))} />
              활성
            </label>
          </div>
        </div>
        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8, marginTop: 16 }}>
          {editingId && perm.canDelete && (
            <button onClick={handleDelete} className="mes-btn mes-btn-delete" style={{ padding: '6px 16px', fontSize: 14, marginRight: 'auto' }}>
              삭제
            </button>
          )}
          <button onClick={() => setModalOpen(false)} style={{ padding: '6px 16px', border: '1px solid #d1d5db', borderRadius: 4, background: '#fff', cursor: 'pointer', fontSize: 14 }}>취소</button>
          {perm.canUpdate && (
            <button onClick={handleSave} disabled={saving} className="mes-btn mes-btn-save" style={{ padding: '6px 16px', fontSize: 14, opacity: saving ? 0.6 : 1 }}>
              {saving ? '저장 중...' : '저장'}
            </button>
          )}
        </div>
      </Modal>
      <ConfirmDialogBulletin />
    </>
  );
}
