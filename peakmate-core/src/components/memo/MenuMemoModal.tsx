import { useState, useEffect, useCallback, useRef } from 'react';
import { authFetch } from '@/lib/api';
import { coreNotify } from '@/stores/useNotifyStore';
import { Modal } from '../ui/Modal';

interface MemoEntry {
  id: number;
  author: string;
  date: string;
  content: string;
}

interface MenuMemoModalProps {
  menuCode: string;
  menuName: string;
  open: boolean;
  onClose: () => void;
  onMemoCountChange: (count: number) => void;
}

export function MenuMemoModal({ menuCode, menuName, open, onClose, onMemoCountChange }: MenuMemoModalProps) {
  const [entries, setEntries] = useState<MemoEntry[]>([]);
  const [newContent, setNewContent] = useState('');
  const [saving, setSaving] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editContent, setEditContent] = useState('');
  const [deleteConfirmId, setDeleteConfirmId] = useState<number | null>(null);
  const listEndRef = useRef<HTMLDivElement>(null);

  const fetchMemos = useCallback(async () => {
    try {
      const res = await authFetch(`/api/menu-memos?menuCode=${encodeURIComponent(menuCode)}`);
      if (res.ok) {
        const json = await res.json();
        const list: MemoEntry[] = json.data?.content ?? [];
        setEntries(list);
        onMemoCountChange(list.length);
      }
    } catch {
      coreNotify('메모 목록 조회에 실패했습니다.', { type: 'error' });
    }
  }, [menuCode, onMemoCountChange]);

  useEffect(() => {
    if (open) {
      fetchMemos();
      setEditingId(null);
      setDeleteConfirmId(null);
    }
  }, [open, fetchMemos]);

  useEffect(() => {
    if (entries.length > 0) {
      listEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [entries.length]);

  const handleSave = useCallback(async () => {
    if (!newContent.trim() || saving) return;
    setSaving(true);
    try {
      await authFetch('/api/menu-memos', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ menuCode, content: newContent.trim() }),
      });
      setNewContent('');
      fetchMemos();
    } catch {
      coreNotify('메모 저장에 실패했습니다.', { type: 'error' });
    } finally {
      setSaving(false);
    }
  }, [newContent, saving, menuCode, fetchMemos]);

  const handleUpdate = useCallback(async (id: number) => {
    if (!editContent.trim()) return;
    try {
      await authFetch(`/api/menu-memos/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content: editContent.trim() }),
      });
      coreNotify('메모가 수정되었습니다.', { type: 'success' });
      setEditingId(null);
      setEditContent('');
      fetchMemos();
    } catch {
      coreNotify('메모 수정에 실패했습니다.', { type: 'error' });
    }
  }, [editContent, fetchMemos]);

  const handleDelete = useCallback(async (id: number) => {
    try {
      await authFetch(`/api/menu-memos/${id}`, { method: 'DELETE' });
      coreNotify('메모가 삭제되었습니다.', { type: 'success' });
      setDeleteConfirmId(null);
      fetchMemos();
    } catch {
      coreNotify('메모 삭제에 실패했습니다.', { type: 'error' });
    }
  }, [fetchMemos]);

  const startEdit = useCallback((entry: MemoEntry) => {
    setEditingId(entry.id);
    setEditContent(entry.content);
    setDeleteConfirmId(null);
  }, []);

  const cancelEdit = useCallback(() => {
    setEditingId(null);
    setEditContent('');
  }, []);

  const btnStyle: React.CSSProperties = {
    background: 'none', border: 'none', cursor: 'pointer', fontSize: 12, padding: '2px 6px',
    borderRadius: 3, lineHeight: 1,
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={`개발 메모 — ${menuName}`}
      width={640}
    >
      {/* 대화 목록 */}
      <div style={{ maxHeight: 350, overflowY: 'auto', marginBottom: 12 }}>
        {entries.length === 0 && (
          <div style={{ textAlign: 'center', color: '#9ca3af', fontSize: 13, padding: 20 }}>
            등록된 메모가 없습니다.
          </div>
        )}
        {entries.map((entry) => (
          <div
            key={entry.id}
            style={{
              padding: '10px 0',
              borderBottom: '1px solid #f3f4f6',
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
              <span style={{ fontSize: 12, color: '#6b7280', fontWeight: 600 }}>
                {entry.author} · {entry.date}
              </span>
              {editingId !== entry.id && deleteConfirmId !== entry.id && (
                <span>
                  <button onClick={() => startEdit(entry)} style={{ ...btnStyle, color: '#2563eb' }}>수정</button>
                  <button onClick={() => setDeleteConfirmId(entry.id)} style={{ ...btnStyle, color: '#dc2626' }}>삭제</button>
                </span>
              )}
            </div>
            {/* 삭제 확인 */}
            {deleteConfirmId === entry.id && (
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '6px 0' }}>
                <span style={{ fontSize: 13, color: '#dc2626' }}>삭제하시겠습니까?</span>
                <button onClick={() => handleDelete(entry.id)} style={{ ...btnStyle, color: '#fff', backgroundColor: '#dc2626', border: '1px solid #dc2626' }}>확인</button>
                <button onClick={() => setDeleteConfirmId(null)} style={{ ...btnStyle, color: '#6b7280', border: '1px solid #d1d5db' }}>취소</button>
              </div>
            )}
            {editingId === entry.id ? (
              <div>
                <textarea
                  value={editContent}
                  onChange={(e) => setEditContent(e.target.value)}
                  rows={3}
                  style={{
                    width: '100%', padding: 8, border: '1px solid #d1d5db', borderRadius: 4,
                    fontSize: 13, lineHeight: 1.6, resize: 'vertical', fontFamily: 'inherit',
                    boxSizing: 'border-box',
                  }}
                />
                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 6, marginTop: 4 }}>
                  <button onClick={cancelEdit} style={{ ...btnStyle, color: '#6b7280', border: '1px solid #d1d5db' }}>취소</button>
                  <button onClick={() => handleUpdate(entry.id)} style={{ ...btnStyle, color: '#fff', backgroundColor: '#2563eb', border: '1px solid #2563eb' }}>저장</button>
                </div>
              </div>
            ) : deleteConfirmId !== entry.id && (
              <div style={{ fontSize: 13, whiteSpace: 'pre-wrap', lineHeight: 1.6 }}>
                {entry.content}
              </div>
            )}
          </div>
        ))}
        <div ref={listEndRef} />
      </div>

      {/* 새 메시지 입력 */}
      <div style={{ borderTop: '1px solid #e5e7eb', paddingTop: 12 }}>
        <textarea
          value={newContent}
          onChange={(e) => setNewContent(e.target.value)}
          placeholder="메모를 입력하세요..."
          rows={3}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) {
              e.preventDefault();
              handleSave();
            }
          }}
          style={{
            width: '100%', padding: 10, border: '1px solid #d1d5db', borderRadius: 6,
            fontSize: 14, lineHeight: 1.6, resize: 'vertical', fontFamily: 'inherit',
            boxSizing: 'border-box',
          }}
        />
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 8 }}>
          <span style={{ fontSize: 11, color: '#94a3b8' }}>Ctrl+Enter로 빠르게 저장</span>
          <div style={{ display: 'flex', gap: 8 }}>
            <button onClick={onClose} className="mes-btn" style={{ fontSize: 13 }}>닫기</button>
            <button
              onClick={handleSave}
              disabled={!newContent.trim() || saving}
              className="mes-btn mes-btn-save"
              style={{ fontSize: 13 }}
            >
              {saving ? '저장 중...' : '저장'}
            </button>
          </div>
        </div>
      </div>
    </Modal>
  );
}
