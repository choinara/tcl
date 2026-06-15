import { createContext, useEffect, useRef, useState, useCallback, type ReactNode } from 'react';

export type ModalSize = 'default' | 'compact' | 'wide';
export const ModalSizeContext = createContext<ModalSize>('default');

interface ModalProps {
  open: boolean;
  onClose: () => void;
  title: string;
  children: ReactNode;
  width?: number;
  compact?: boolean;
  /** 3열 와이드 모달 (입력필드 75% 폭) */
  wide?: boolean;
}

export function Modal({ open, onClose, title, children, width, compact = false, wide = false }: ModalProps) {
  const effectiveWidth = width ?? (wide ? 900 : 640);
  const mode: ModalSize = wide ? 'wide' : compact ? 'compact' : 'default';
  const overlayRef = useRef<HTMLDivElement>(null);
  const dialogRef = useRef<HTMLDivElement>(null);
  const [pos, setPos] = useState<{ x: number; y: number } | null>(null);
  const dragState = useRef<{ startX: number; startY: number; origX: number; origY: number } | null>(null);

  const previousFocusRef = useRef<HTMLElement | null>(null);

  // 모달이 열릴 때마다 위치 초기화 + 포커스 저장
  useEffect(() => {
    if (open) {
      setPos(null);
      previousFocusRef.current = document.activeElement as HTMLElement;
    }
  }, [open]);

  // 모달 열릴 때 첫 포커스 가능 요소로 이동, 닫힐 때 복원
  useEffect(() => {
    if (open) {
      const timer = setTimeout(() => {
        const focusable = dialogRef.current?.querySelector<HTMLElement>(
          'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
        );
        focusable?.focus();
      }, 0);
      return () => clearTimeout(timer);
    } else if (previousFocusRef.current) {
      previousFocusRef.current.focus();
      previousFocusRef.current = null;
    }
  }, [open]);

  // Escape 닫기 + Tab 트래핑
  useEffect(() => {
    if (!open) return;
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') { onClose(); return; }
      if (e.key === 'Tab') {
        const focusables = dialogRef.current?.querySelectorAll<HTMLElement>(
          'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
        );
        if (!focusables?.length) return;
        const first = focusables[0];
        const last = focusables[focusables.length - 1];
        if (e.shiftKey && document.activeElement === first) {
          e.preventDefault(); last.focus();
        } else if (!e.shiftKey && document.activeElement === last) {
          e.preventDefault(); first.focus();
        }
      }
    };
    document.addEventListener('keydown', handleKey);
    return () => document.removeEventListener('keydown', handleKey);
  }, [open, onClose]);

  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    // 닫기 버튼 클릭은 드래그 시작하지 않음
    if ((e.target as HTMLElement).closest('button')) return;
    e.preventDefault();
    const dialog = dialogRef.current;
    if (!dialog) return;

    let origX: number, origY: number;
    if (pos) {
      origX = pos.x;
      origY = pos.y;
    } else {
      const rect = dialog.getBoundingClientRect();
      origX = rect.left;
      origY = rect.top;
    }
    dragState.current = { startX: e.clientX, startY: e.clientY, origX, origY };

    const handleMouseMove = (ev: MouseEvent) => {
      if (!dragState.current) return;
      const dx = ev.clientX - dragState.current.startX;
      const dy = ev.clientY - dragState.current.startY;
      setPos({ x: dragState.current.origX + dx, y: dragState.current.origY + dy });
    };
    const handleMouseUp = () => {
      dragState.current = null;
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
  }, [pos]);

  if (!open) return null;

  const dialogStyle: React.CSSProperties = {
    background: '#fff', borderRadius: 8, width: effectiveWidth,
    maxHeight: '85vh', display: 'flex', flexDirection: 'column',
    boxShadow: '0 20px 60px rgba(0,0,0,0.3)',
    ...(pos ? { position: 'fixed', left: pos.x, top: pos.y, margin: 0 } : {}),
  };

  return (
    <div
      ref={overlayRef}
      onClick={(e) => { if (e.target === overlayRef.current) onClose(); }}
      style={{
        position: 'fixed', inset: 0, zIndex: 50,
        background: 'rgba(0,0,0,0.15)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        pointerEvents: pos ? 'none' : 'auto',
      }}
    >
      <div ref={dialogRef} role="dialog" aria-modal="true" aria-labelledby="modal-title" style={{ ...dialogStyle, pointerEvents: 'auto' }}>
        <div
          onMouseDown={handleMouseDown}
          style={{
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            padding: mode === 'compact' ? '6px 14px' : mode === 'wide' ? '7px 20px' : '8px 20px',
            borderBottom: '1px solid #cbd5e1',
            background: 'linear-gradient(135deg, #1e3a5f 0%, #2d5a8e 100%)',
            borderRadius: '8px 8px 0 0',
            cursor: 'move', userSelect: 'none',
          }}
        >
          <h3 id="modal-title" style={{ margin: 0, fontSize: mode === 'compact' ? 'var(--font-size-md)' : 'var(--font-size-modal-title, var(--font-size-lg))', fontWeight: 700, color: '#fff' }}>{title}</h3>
          <button
            onClick={onClose}
            aria-label="닫기"
            style={{
              background: 'none', border: 'none', fontSize: 'var(--font-size-xl)',
              cursor: 'pointer', color: 'rgba(255,255,255,0.7)', padding: '0 4px',
            }}
          >
            &times;
          </button>
        </div>
        <div style={{ padding: mode === 'compact' ? 12 : mode === 'wide' ? 16 : 20, overflow: 'auto', flex: 1, backgroundColor: '#f0f4f8' }}>
          <ModalSizeContext.Provider value={mode}>
            {children}
          </ModalSizeContext.Provider>
        </div>
      </div>
    </div>
  );
}
