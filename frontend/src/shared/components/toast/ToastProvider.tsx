import React, { createContext, useCallback, useContext, useState } from 'react';
import { X, Trash2 } from 'lucide-react';

type ToastType = 'success' | 'error' | 'warning' | 'info';

interface Toast {
  id: number;
  message: string;
  type: ToastType;
  persistent?: boolean;
}

interface ErrorHistoryItem {
  id: number;
  timestamp: Date;
  message: string;
}

interface ToastOptions {
  type?: ToastType;
  /** true이면 사용자가 확인 클릭할 때까지 사라지지 않음 */
  persistent?: boolean;
}

interface ToastContextType {
  notify: (message: string, options?: ToastOptions) => void;
  errorHistory: ErrorHistoryItem[];
  clearErrorHistory: () => void;
  removeErrorHistory: (id: number) => void;
  errorPanelOpen: boolean;
  setErrorPanelOpen: (open: boolean) => void;
}

const ToastContext = createContext<ToastContextType>({
  notify: () => {},
  errorHistory: [],
  clearErrorHistory: () => {},
  removeErrorHistory: () => {},
  errorPanelOpen: false,
  setErrorPanelOpen: () => {},
});

export const useToast = () => useContext(ToastContext);

let nextId = 0;
let nextErrorId = 0;
const MAX_ERROR_HISTORY = 100;

const TOAST_COLORS: Record<ToastType, string> = {
  success: 'bg-green-600',
  error: 'bg-red-600',
  warning: 'bg-amber-500',
  info: 'bg-blue-600',
};

function formatTimestamp(date: Date): string {
  const y = date.getFullYear();
  const mo = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  const h = String(date.getHours()).padStart(2, '0');
  const mi = String(date.getMinutes()).padStart(2, '0');
  const s = String(date.getSeconds()).padStart(2, '0');
  return `${y}-${mo}-${d} ${h}:${mi}:${s}`;
}

export const ToastProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [toasts, setToasts] = useState<Toast[]>([]);
  const [errorHistory, setErrorHistory] = useState<ErrorHistoryItem[]>([]);
  const [errorPanelOpen, setErrorPanelOpen] = useState(false);

  const notify = useCallback((message: string, options?: ToastOptions) => {
    const id = nextId++;
    const type = options?.type ?? 'info';
    const persistent = options?.persistent ?? false;
    setToasts((prev) => [...prev, { id, message, type, persistent }]);
    if (!persistent) {
      setTimeout(() => {
        setToasts((prev) => prev.filter((t) => t.id !== id));
      }, 5000);
    }
    // 에러 메시지를 이력에 저장
    if (type === 'error') {
      setErrorHistory((prev) => {
        const item: ErrorHistoryItem = { id: nextErrorId++, timestamp: new Date(), message };
        const updated = [item, ...prev];
        if (updated.length > MAX_ERROR_HISTORY) return updated.slice(0, MAX_ERROR_HISTORY);
        return updated;
      });
    }
  }, []);

  const removeToast = useCallback((id: number) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const clearErrorHistory = useCallback(() => {
    setErrorHistory([]);
    setErrorPanelOpen(false);
  }, []);

  const removeErrorHistory = useCallback((id: number) => {
    setErrorHistory((prev) => {
      const updated = prev.filter((e) => e.id !== id);
      if (updated.length === 0) setErrorPanelOpen(false);
      return updated;
    });
  }, []);

  return (
    <ToastContext.Provider value={{ notify, errorHistory, clearErrorHistory, removeErrorHistory, errorPanelOpen, setErrorPanelOpen }}>
      {children}

      {/* 에러 이력 패널 */}
      {errorPanelOpen && errorHistory.length > 0 && (
        <>
          {/* 배경 오버레이 (클릭 시 닫힘) */}
          <div
            onClick={() => setErrorPanelOpen(false)}
            style={{ position: 'fixed', inset: 0, zIndex: 9998, background: 'transparent' }}
          />
          <div
            style={{
              position: 'fixed',
              bottom: 30,
              right: 16,
              zIndex: 9999,
              width: 420,
              maxHeight: '60vh',
              backgroundColor: '#fff',
              border: '1px solid #e2e8f0',
              borderRadius: 8,
              boxShadow: '0 8px 32px rgba(0,0,0,0.18)',
              display: 'flex',
              flexDirection: 'column',
            }}
          >
            {/* 헤더 */}
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '10px 14px',
                borderBottom: '1px solid #e2e8f0',
                backgroundColor: '#fef2f2',
                borderRadius: '8px 8px 0 0',
              }}
            >
              <span style={{ fontWeight: 600, fontSize: 13, color: '#dc2626' }}>
                에러 이력 ({errorHistory.length}건)
              </span>
              <div style={{ display: 'flex', gap: 6 }}>
                <button
                  onClick={clearErrorHistory}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 3,
                    fontSize: 11,
                    padding: '2px 8px',
                    borderRadius: 4,
                    border: '1px solid #fca5a5',
                    backgroundColor: '#fff',
                    color: '#dc2626',
                    cursor: 'pointer',
                  }}
                  title="전체 삭제"
                >
                  <Trash2 size={12} />
                  전체 삭제
                </button>
                <button
                  onClick={() => setErrorPanelOpen(false)}
                  style={{
                    fontSize: 11,
                    padding: '2px 8px',
                    borderRadius: 4,
                    border: '1px solid #e2e8f0',
                    backgroundColor: '#fff',
                    color: '#64748b',
                    cursor: 'pointer',
                  }}
                >
                  닫기
                </button>
              </div>
            </div>
            {/* 에러 목록 */}
            <div style={{ overflowY: 'auto', flex: 1, minHeight: 0 }}>
              {errorHistory.map((item) => (
                <div
                  key={item.id}
                  style={{
                    display: 'flex',
                    alignItems: 'flex-start',
                    gap: 8,
                    padding: '8px 14px',
                    borderBottom: '1px solid #f1f5f9',
                    fontSize: 12,
                  }}
                >
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ color: '#94a3b8', fontSize: 11, marginBottom: 2 }}>
                      {formatTimestamp(item.timestamp)}
                    </div>
                    <div style={{ color: '#1e293b', wordBreak: 'break-word' }}>
                      {item.message}
                    </div>
                  </div>
                  <button
                    onClick={() => removeErrorHistory(item.id)}
                    style={{
                      flexShrink: 0,
                      background: 'none',
                      border: 'none',
                      cursor: 'pointer',
                      color: '#94a3b8',
                      padding: 2,
                      marginTop: 2,
                    }}
                    title="삭제"
                  >
                    <X size={14} />
                  </button>
                </div>
              ))}
            </div>
          </div>
        </>
      )}

      {/* Toast container */}
      {toasts.length > 0 && (
        <div className="fixed bottom-4 right-4 z-[9999] flex flex-col gap-2">
          {toasts.map((toast) => (
            <div
              key={toast.id}
              className={`${TOAST_COLORS[toast.type]} text-white px-4 py-3 rounded-lg shadow-lg flex items-center gap-3 min-w-[280px] max-w-[400px] animate-[slideIn_0.3s_ease-out]`}
            >
              <span className="flex-1 text-sm">{toast.message}</span>
              <button onClick={() => removeToast(toast.id)} className="shrink-0 opacity-70 hover:opacity-100" title="닫기">
                {toast.persistent ? (
                  <span style={{ fontSize: 12, fontWeight: 600 }}>확인</span>
                ) : (
                  <X size={16} />
                )}
              </button>
            </div>
          ))}
        </div>
      )}
    </ToastContext.Provider>
  );
};
