import { useEffect, useRef, type ReactNode } from 'react';

interface DrawerProps {
  open: boolean;
  onClose: () => void;
  title: string;
  children: ReactNode;
  width?: number;
  position?: 'right' | 'left';
}

export function Drawer({ open, onClose, title, children, width = 480, position = 'right' }: DrawerProps) {
  const overlayRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', handleKey);
    return () => document.removeEventListener('keydown', handleKey);
  }, [open, onClose]);

  const isRight = position === 'right';

  return (
    <>
      {/* Overlay */}
      <div
        ref={overlayRef}
        onClick={(e) => { if (e.target === overlayRef.current) onClose(); }}
        style={{
          position: 'fixed', inset: 0, zIndex: 50,
          background: open ? 'rgba(0,0,0,0.15)' : 'transparent',
          pointerEvents: open ? 'auto' : 'none',
          transition: 'background 0.25s ease',
        }}
      />

      {/* Drawer panel */}
      <div
        style={{
          position: 'fixed',
          top: 0,
          bottom: 0,
          [isRight ? 'right' : 'left']: 0,
          width,
          zIndex: 50,
          display: 'flex',
          flexDirection: 'column',
          background: '#fff',
          boxShadow: open ? '-4px 0 20px rgba(0,0,0,0.15)' : 'none',
          transform: open
            ? 'translateX(0)'
            : `translateX(${isRight ? '100%' : '-100%'})`,
          transition: 'transform 0.25s ease',
          pointerEvents: open ? 'auto' : 'none',
        }}
      >
        {/* Header */}
        <div
          style={{
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            padding: '9px 16px',
            borderBottom: '1px solid #cbd5e1',
            background: 'linear-gradient(135deg, #1e3a5f 0%, #2d5a8e 100%)',
            flexShrink: 0,
          }}
        >
          <h3 style={{ margin: 0, fontSize: 'var(--font-size-modal-title, var(--font-size-lg, 16px))', fontWeight: 700, color: '#fff' }}>{title}</h3>
          <button
            onClick={onClose}
            style={{
              background: 'none', border: 'none', fontSize: 'var(--font-size-xl)',
              cursor: 'pointer', color: 'rgba(255,255,255,0.7)', padding: '0 4px',
            }}
          >
            &times;
          </button>
        </div>

        {/* Body */}
        <div style={{ flex: 1, overflow: 'hidden', display: 'flex', flexDirection: 'column', backgroundColor: '#f0f4f8' }}>
          {children}
        </div>
      </div>
    </>
  );
}
