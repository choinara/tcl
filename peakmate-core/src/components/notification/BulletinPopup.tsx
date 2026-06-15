import { useState, useEffect, useCallback } from 'react';
import { Modal } from '@/components/ui/Modal';
import { authFetch } from '@/lib/api';
import { useAuthStore } from '@/stores/useAuthStore';
import { usePreferenceStore } from '@/stores/usePreferenceStore';

interface BulletinItem {
  id: number;
  title: string;
  content: string;
}

const DISMISSED_KEY = 'pm-dismissed-bulletins';

function getDismissedIds(): Set<number> {
  try {
    const raw = localStorage.getItem(DISMISSED_KEY);
    if (!raw) return new Set();
    const obj = JSON.parse(raw) as Record<string, boolean>;
    return new Set(Object.keys(obj).map(Number));
  } catch {
    return new Set();
  }
}

function addDismissedId(id: number) {
  try {
    const raw = localStorage.getItem(DISMISSED_KEY);
    const obj: Record<string, boolean> = raw ? JSON.parse(raw) : {};
    obj[String(id)] = true;
    localStorage.setItem(DISMISSED_KEY, JSON.stringify(obj));
  } catch {
    localStorage.setItem(DISMISSED_KEY, JSON.stringify({ [String(id)]: true }));
  }
}

export function BulletinPopup() {
  const justLoggedIn = useAuthStore((s) => s.justLoggedIn);
  const prefLoaded = usePreferenceStore((s) => s.loaded);

  const [bulletins, setBulletins] = useState<BulletinItem[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [dontShowAgain, setDontShowAgain] = useState(false);
  const [triggered, setTriggered] = useState(false);

  useEffect(() => {
    if (justLoggedIn && prefLoaded && !triggered) {
      setTriggered(true);
    }
  }, [justLoggedIn, prefLoaded, triggered]);

  useEffect(() => {
    if (!triggered) return;
    (async () => {
      try {
        const res = await authFetch('/api/system/bulletins/login-popup');
        if (!res.ok) return;
        const json = await res.json();
        const dismissed = getDismissedIds();
        const filtered = ((json.data ?? []) as BulletinItem[]).filter(b => !dismissed.has(b.id));
        setBulletins(filtered);
        setCurrentIndex(0);
      } catch {
        // 게시물 조회 실패 — 빈 목록으로 표시
      }
    })();
  }, [triggered]);

  const handleClose = useCallback(() => {
    const current = bulletins[currentIndex];
    if (current && dontShowAgain) {
      addDismissedId(current.id);
    }
    setDontShowAgain(false);

    if (currentIndex < bulletins.length - 1) {
      setCurrentIndex(prev => prev + 1);
    } else {
      setBulletins([]);
    }
  }, [bulletins, currentIndex, dontShowAgain]);

  if (bulletins.length === 0) return null;
  const current = bulletins[currentIndex];
  if (!current) return null;

  return (
    <Modal
      open={true}
      onClose={handleClose}
      title={current.title}
      width={520}
    >
      <div style={{ padding: 16 }}>
        <div
          style={{
            minHeight: 120,
            maxHeight: 400,
            overflow: 'auto',
            fontSize: 'var(--font-size-base)',
            lineHeight: 1.7,
            whiteSpace: 'pre-wrap',
            color: '#334155',
          }}
        >
          {current.content}
        </div>

        {bulletins.length > 1 && (
          <div style={{ textAlign: 'center', fontSize: 'var(--font-size-sm)', color: '#94a3b8', marginTop: 8 }}>
            {currentIndex + 1} / {bulletins.length}
          </div>
        )}

        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 16 }}>
          <label style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 'var(--font-size-sm)', cursor: 'pointer', color: '#64748b' }}>
            <input type="checkbox" checked={dontShowAgain} onChange={e => setDontShowAgain(e.target.checked)} />
            다시 보지 않기
          </label>
          <button
            onClick={handleClose}
            className="mes-btn mes-btn-save"
            style={{ padding: '6px 20px', fontSize: 'var(--font-size-base)' }}
          >
            {currentIndex < bulletins.length - 1 ? '확인 →' : '닫기'}
          </button>
        </div>
      </div>
    </Modal>
  );
}
