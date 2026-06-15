import { useEffect, useRef, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '@/stores/useAuthStore';

const SESSION_TIMEOUT = 3 * 60 * 60 * 1000; // 3시간
const WARNING_BEFORE = 5 * 60 * 1000;   // 만료 5분 전 경고

export function SessionTimeoutProvider({ children }: { children: React.ReactNode }) {
  const [showWarning, setShowWarning] = useState(false);
  const timeoutRef = useRef<ReturnType<typeof setTimeout>>();
  const warningRef = useRef<ReturnType<typeof setTimeout>>();
  const navigate = useNavigate();
  const user = useAuthStore((s) => s.user);
  const logout = useAuthStore((s) => s.logout);

  const handleLogout = useCallback(async () => {
    setShowWarning(false);
    await logout();
    navigate('/login');
  }, [logout, navigate]);

  const resetTimers = useCallback(() => {
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    if (warningRef.current) clearTimeout(warningRef.current);
    setShowWarning(false);

    warningRef.current = setTimeout(() => {
      setShowWarning(true);
    }, SESSION_TIMEOUT - WARNING_BEFORE);

    timeoutRef.current = setTimeout(() => {
      handleLogout();
    }, SESSION_TIMEOUT);
  }, [handleLogout]);

  useEffect(() => {
    if (!user) return;

    const events = ['mousedown', 'keydown', 'scroll', 'touchstart'];

    const onActivity = () => {
      resetTimers();
    };

    events.forEach((event) => window.addEventListener(event, onActivity));
    resetTimers();

    return () => {
      events.forEach((event) => window.removeEventListener(event, onActivity));
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
      if (warningRef.current) clearTimeout(warningRef.current);
    };
  }, [user, resetTimers]);

  if (!user) return <>{children}</>;

  return (
    <>
      {showWarning && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          zIndex: 9999,
          background: '#fef3c7',
          borderBottom: '1px solid #f59e0b',
          padding: '8px 16px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: 12,
          fontSize: 'var(--font-size-base)',
          color: '#92400e',
        }}>
          <span>세션이 5분 후 만료됩니다.</span>
          <button
            onClick={resetTimers}
            style={{
              padding: '4px 12px',
              background: '#f59e0b',
              color: 'white',
              border: 'none',
              borderRadius: 4,
              cursor: 'pointer',
              fontSize: 'var(--font-size-sm)',
              fontWeight: 600,
            }}
          >
            연장
          </button>
        </div>
      )}
      {children}
    </>
  );
}
