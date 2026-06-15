import React, { useEffect, useRef, type ReactNode } from 'react';
import { X } from 'lucide-react';

export interface CustomDialogProps {
  open: boolean;
  onClose: () => void;
  title?: ReactNode;
  subtitle?: ReactNode;
  children: ReactNode;
  actions?: ReactNode;
  onConfirm?: () => void;
  onCancel?: () => void;
  confirmText?: string;
  cancelText?: string;
  hideActions?: boolean;
  showCloseButton?: boolean;
  width?: string | number;
  height?: string | number;
  contentSx?: React.CSSProperties;
  disableEscapeKeyDown?: boolean;
  sx?: React.CSSProperties;
  maxWidth?: string;
  fullWidth?: boolean;
  fullScreen?: boolean;
  confirmButtonColor?: string;
  disableBackdropClick?: boolean;
}

export default function Dialog({
  open,
  onClose,
  title,
  subtitle,
  children,
  actions,
  onConfirm,
  onCancel,
  confirmText = '확인',
  cancelText = '취소',
  hideActions = false,
  showCloseButton = true,
  width,
  height,
  contentSx,
  disableEscapeKeyDown = false,
  sx,
}: CustomDialogProps) {
  const dialogRef = useRef<HTMLDialogElement>(null);

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;
    if (open) {
      if (!dialog.open) dialog.showModal();
    } else {
      dialog.close();
    }
  }, [open]);

  useEffect(() => {
    if (disableEscapeKeyDown) {
      const handler = (e: KeyboardEvent) => {
        if (e.key === 'Escape') e.preventDefault();
      };
      document.addEventListener('keydown', handler);
      return () => document.removeEventListener('keydown', handler);
    }
  }, [disableEscapeKeyDown]);

  const handleConfirm = () => {
    onConfirm?.();
    onClose();
  };

  const handleCancel = () => {
    onCancel?.();
    onClose();
  };

  const handleBackdropClick = (e: React.MouseEvent) => {
    if (e.target === dialogRef.current) onClose();
  };

  const dialogStyle: React.CSSProperties = {
    borderRadius: 16,
    border: 'none',
    padding: 0,
    maxWidth: '90vw',
    maxHeight: '90vh',
    ...(width && { width, maxWidth: width }),
    ...(height && height !== 'auto' && { height }),
    ...sx,
  };

  return (
    <dialog
      ref={dialogRef}
      className="backdrop:bg-black/50"
      style={dialogStyle}
      onClick={handleBackdropClick}
    >
      <div className="flex flex-col h-full" onClick={(e) => e.stopPropagation()}>
        {(title || subtitle) && (
          <div className="flex items-center justify-between h-14 px-6 border-b border-[var(--color-border)]">
            <div className="flex items-center gap-3">
              {title && <span className="text-base font-bold text-[var(--color-text-primary)]">{title}</span>}
              {subtitle && <span className="text-sm text-[var(--color-text-secondary)]">{subtitle}</span>}
            </div>
            {showCloseButton && (
              <button onClick={onClose} className="p-1 text-gray-400 hover:text-gray-600 transition-colors">
                <X size={20} />
              </button>
            )}
          </div>
        )}

        <div className="flex-1 overflow-auto min-h-0" style={contentSx}>
          {children}
        </div>

        {!hideActions && (
          <div className="flex justify-center gap-2 p-2.5 border-t border-[var(--color-border)]">
            {actions ? (
              actions
            ) : (
              <>
                {onCancel && (
                  <button
                    onClick={handleCancel}
                    className="px-4 py-2 text-sm rounded-md border border-[var(--color-border)] text-[var(--color-text-primary)] hover:bg-[var(--color-bg-hover)] transition-colors"
                  >
                    {cancelText}
                  </button>
                )}
                {onConfirm && (
                  <button
                    onClick={handleConfirm}
                    className="px-4 py-2 text-sm rounded-md bg-[var(--color-primary)] text-white hover:opacity-90 transition-colors"
                  >
                    {confirmText}
                  </button>
                )}
              </>
            )}
          </div>
        )}
      </div>
    </dialog>
  );
}
