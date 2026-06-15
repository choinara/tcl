import { useCallback, useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';

/* ── 모듈 레벨 안정 컴포넌트 (React가 동일 type으로 인식 → unmount/remount 방지) ── */
interface InnerProps {
  open: boolean;
  message: string;
  title: string;
  confirmText: string;
  cancelText: string;
  onConfirm: () => void;
  onCancel: () => void;
}

function ConfirmDialogInner({ open, message, title, confirmText, cancelText, onConfirm, onCancel }: InnerProps) {
  const cancelRef = useRef<HTMLButtonElement>(null);
  const dialogRef = useRef<HTMLDivElement>(null);
  const previousFocusRef = useRef<HTMLElement | null>(null);

  useEffect(() => {
    if (open) {
      previousFocusRef.current = document.activeElement as HTMLElement;
      const timer = setTimeout(() => cancelRef.current?.focus(), 0);
      return () => clearTimeout(timer);
    } else if (previousFocusRef.current) {
      previousFocusRef.current.focus();
      previousFocusRef.current = null;
    }
  }, [open]);

  if (!open) return null;

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape') { onCancel(); return; }
    if (e.key === 'Tab') {
      const focusables = dialogRef.current?.querySelectorAll<HTMLElement>('button');
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

  return (
    <div
      onClick={onCancel}
      onKeyDown={handleKeyDown}
      style={{
        position: 'fixed', inset: 0, zIndex: 60,
        background: 'rgba(0,0,0,0.15)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
      }}
    >
      <div
        ref={dialogRef}
        role="alertdialog"
        aria-modal="true"
        aria-labelledby="confirm-dialog-title"
        aria-describedby="confirm-dialog-message"
        onClick={(e) => e.stopPropagation()}
        style={{
          background: '#fff', borderRadius: 8, width: 400,
          boxShadow: '0 20px 60px rgba(0,0,0,0.3)',
          overflow: 'hidden',
        }}
      >
        {/* Header */}
        <div
          style={{
            display: 'flex', alignItems: 'center', gap: 8,
            padding: '14px 20px',
            background: 'linear-gradient(135deg, #1e3a5f 0%, #2d5a8e 100%)',
            borderRadius: '8px 8px 0 0',
          }}
        >
          <span style={{ fontSize: 'var(--font-size-xl)', color: '#fbbf24' }}>&#9888;</span>
          <h3 id="confirm-dialog-title" style={{ margin: 0, fontSize: 'var(--font-size-base)', fontWeight: 700, color: '#fff' }}>{title}</h3>
        </div>

        {/* Body */}
        <div style={{ padding: '28px 24px 20px', backgroundColor: '#f0f4f8', textAlign: 'center' }}>
          <p id="confirm-dialog-message" style={{ margin: 0, fontSize: 'var(--font-size-md)', color: '#1e293b', lineHeight: 1.6, whiteSpace: 'pre-line' }}>
            {message}
          </p>
        </div>

        {/* Footer */}
        <div
          style={{
            display: 'flex', justifyContent: 'space-between',
            padding: '14px 24px',
            backgroundColor: '#f0f4f8',
            borderTop: '1px solid #e2e8f0',
          }}
        >
          <button
            onClick={onConfirm}
            style={{
              padding: '8px 24px', borderRadius: 4,
              border: 'none', cursor: 'pointer',
              backgroundColor: '#dc2626', color: '#fff',
              fontSize: 'var(--font-size-base)', fontWeight: 600,
            }}
          >
            {confirmText}
          </button>
          <button
            ref={cancelRef}
            onClick={onCancel}
            style={{
              padding: '8px 24px', borderRadius: 4,
              border: '1px solid #d1d5db', cursor: 'pointer',
              backgroundColor: '#fff', color: '#374151',
              fontSize: 'var(--font-size-base)', fontWeight: 600,
            }}
          >
            {cancelText}
          </button>
        </div>
      </div>
    </div>
  );
}

/* ── Hook ── */
export function useConfirm() {
  const { t } = useTranslation();
  const [open, setOpen] = useState(false);
  const [message, setMessage] = useState('');
  const resolveRef = useRef<((value: boolean) => void) | null>(null);

  const confirm = useCallback((msg?: string): Promise<boolean> => {
    return new Promise<boolean>((resolve) => {
      resolveRef.current = resolve;
      setMessage(msg || t('message.deleteConfirmDefault'));
      setOpen(true);
    });
  }, [t]);

  const handleConfirm = useCallback(() => {
    resolveRef.current?.(true);
    resolveRef.current = null;
    setOpen(false);
  }, []);

  const handleCancel = useCallback(() => {
    resolveRef.current?.(false);
    resolveRef.current = null;
    setOpen(false);
  }, []);

  function ConfirmDialog() {
    return (
      <ConfirmDialogInner
        open={open}
        message={message}
        title={t('common.confirmTitle')}
        confirmText={t('common.confirm')}
        cancelText={t('common.cancel')}
        onConfirm={handleConfirm}
        onCancel={handleCancel}
      />
    );
  }

  return { confirm, ConfirmDialog };
}
