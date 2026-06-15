import { create } from 'zustand';

interface NotifyOptions {
  type?: 'success' | 'error' | 'warning' | 'info';
  persistent?: boolean;
}

type NotifyFn = (message: string, options?: NotifyOptions) => void;

interface ErrorHistoryItem {
  id: number;
  timestamp: Date;
  message: string;
}

interface NotifyStore {
  // 알림 전송 (frontend ToastProvider → peakmate-core)
  notifyFn: NotifyFn | null;
  setNotifyFn: (fn: NotifyFn) => void;

  // 에러 이력 (frontend ToastProvider에서 동기화, 에러 빈도 낮아 성능 영향 무시 가능)
  errorHistory: ErrorHistoryItem[];
  setErrorHistory: (items: ErrorHistoryItem[]) => void;

  // 에러 패널 열기 (ToastProvider 함수를 프록시 — store에 boolean 상태 없음, 양방향 동기화 불필요)
  errorPanelOpenFn: ((open: boolean) => void) | null;
  setErrorPanelOpenFn: (fn: (open: boolean) => void) => void;
  setErrorPanelOpen: (open: boolean) => void;
}

export type { NotifyFn, NotifyOptions, ErrorHistoryItem };

export const useNotifyStore = create<NotifyStore>((set, get) => ({
  notifyFn: null,
  setNotifyFn: (fn) => set({ notifyFn: fn }),

  errorHistory: [],
  setErrorHistory: (items) => set({ errorHistory: items }),

  errorPanelOpenFn: null,
  setErrorPanelOpenFn: (fn) => set({ errorPanelOpenFn: fn }),
  setErrorPanelOpen: (open) => {
    const fn = get().errorPanelOpenFn;
    if (fn) fn(open); // ToastProvider의 setErrorPanelOpen 직접 호출 — Context 상태 변경 → 패널 UI 반영
  },
}));

/** peakmate-core 내부에서 사용하는 알림 호출 헬퍼 */
export function coreNotify(message: string, options?: NotifyOptions): void {
  const fn = useNotifyStore.getState().notifyFn;
  if (fn) {
    fn(message, options);
  } else {
    console.warn('[coreNotify] notifyFn 미초기화:', message);
  }
}
