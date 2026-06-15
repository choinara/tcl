import { useState, useEffect, useCallback } from 'react';
import { authFetch } from '@/lib/api';
import { useAuthStore } from '@/stores/useAuthStore';
import { X } from 'lucide-react';

interface ActiveNotification {
  id: number;
  message: string;
}

const DISMISSED_KEY = 'pm-dismissed-notifications';

function getDismissedIds(): Set<number> {
  try {
    const raw = localStorage.getItem(DISMISSED_KEY);
    if (!raw) return new Set();
    return new Set(JSON.parse(raw) as number[]);
  } catch {
    return new Set();
  }
}

function addDismissedId(id: number) {
  const ids = getDismissedIds();
  ids.add(id);
  localStorage.setItem(DISMISSED_KEY, JSON.stringify([...ids]));
}

export function NotificationBanner() {
  const [notifications, setNotifications] = useState<ActiveNotification[]>([]);
  const [sessionDismissed, setSessionDismissed] = useState<Set<number>>(new Set());
  const [dontShowAgain, setDontShowAgain] = useState(false);

  const fetchNotifications = useCallback(async () => {
    try {
      const res = await authFetch('/api/system/notifications/active');
      if (!res.ok) return;
      const json = await res.json();
      const dismissed = getDismissedIds();
      const filtered = ((json.data ?? []) as ActiveNotification[]).filter(n => !dismissed.has(n.id));
      setNotifications(filtered);
    } catch {
      // 60초 간격 백그라운드 폴링 — 실패 시 다음 주기에 자동 재시도
    }
  }, []);

  const user = useAuthStore(s => s.user);

  useEffect(() => {
    if (!user) return;

    fetchNotifications();
    const interval = setInterval(fetchNotifications, 60_000);
    return () => clearInterval(interval);
  }, [user, fetchNotifications]);

  const handleClose = useCallback((id: number) => {
    if (dontShowAgain) {
      addDismissedId(id);
    }
    setSessionDismissed(prev => new Set(prev).add(id));
    setDontShowAgain(false);
  }, [dontShowAgain]);

  const handleDontShowAgain = useCallback((checked: boolean, id: number) => {
    setDontShowAgain(checked);
    if (checked) {
      addDismissedId(id);
      setSessionDismissed(prev => new Set(prev).add(id));
    }
  }, []);

  const visible = notifications.filter(n => !sessionDismissed.has(n.id));
  if (visible.length === 0) return null;

  const current = visible[0];

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      zIndex: 9998,
      background: '#fef9c3',
      borderBottom: '2px solid #eab308',
      padding: '10px 16px',
      display: 'flex',
      alignItems: 'center',
      fontSize: 'var(--font-size-xl)',
      color: '#854d0e',
    }}>
      <span style={{ flex: 1, textAlign: 'center', fontWeight: 500, wordBreak: 'break-word', whiteSpace: 'pre-wrap' }}>
        {current.message}
        {visible.length > 1 && (
          <span style={{ fontSize: 'var(--font-size-lg)', color: '#a16207', marginLeft: 8 }}>+{visible.length - 1}</span>
        )}
      </span>
      <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexShrink: 0 }}>
        <label style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 'var(--font-size-sm)', cursor: 'pointer', color: '#a16207' }}>
          <input type="checkbox" checked={dontShowAgain} onChange={e => handleDontShowAgain(e.target.checked, current.id)} style={{ width: 14, height: 14 }} />
          다시 보지 않기
        </label>
        <button
          onClick={() => handleClose(current.id)}
          style={{
            background: 'none', border: 'none', cursor: 'pointer', padding: 2,
            color: '#a16207', display: 'flex', alignItems: 'center',
          }}
          title="닫기"
        >
          <X size={20} />
        </button>
      </div>
    </div>
  );
}
