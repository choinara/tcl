import { createContext } from 'react';

type ToastType = 'success' | 'error' | 'warning' | 'info';

export interface ToastOptions {
  type?: ToastType;
  /** true이면 사용자가 확인 클릭할 때까지 사라지지 않음 */
  persistent?: boolean;
  /** 자동 숨김 지연 시간 (ms) */
  duration?: number;
}

export interface ErrorHistoryItem {
  id: number;
  timestamp: Date;
  message: string;
}

export interface ToastContextType {
  notify: (message: string, options?: ToastOptions) => void;
  errorHistory: ErrorHistoryItem[];
  clearErrorHistory: () => void;
  removeErrorHistory: (id: number) => void;
  errorPanelOpen: boolean;
  setErrorPanelOpen: (open: boolean) => void;
}

export const ToastContext = createContext<ToastContextType>({
  notify: () => {},
  errorHistory: [],
  clearErrorHistory: () => {},
  removeErrorHistory: () => {},
  errorPanelOpen: false,
  setErrorPanelOpen: () => {},
});
