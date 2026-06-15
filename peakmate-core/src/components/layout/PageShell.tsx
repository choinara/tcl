import type { ReactNode, CSSProperties } from 'react';
import { PageTitle } from '../ui/PageTitle';
import { MenuMemoButton } from '../memo/MenuMemoButton';

interface PageShellProps {
  title: string;
  menuCode: string;
  layout?: 'master' | 'transactional';
  toolbar?: ReactNode;
  toolbarRight?: ReactNode;
  hideInactive?: boolean;
  onToggleInactive?: () => void;
  children: ReactNode;
}

const masterStyle: CSSProperties = {
  display: 'flex', flexDirection: 'column', gap: 8,
  height: '100%', overflow: 'hidden',
};

const transactionalStyle: CSSProperties = {
  display: 'flex', flexDirection: 'column', gap: 8, minHeight: 0,
};

const toolbarLeftStyle: CSSProperties = { display: 'flex', alignItems: 'center', gap: 8 };
const toolbarRightStyle: CSSProperties = { display: 'flex', gap: 6 };

export function PageShell({
  title,
  menuCode,
  layout = 'transactional',
  toolbar,
  toolbarRight,
  hideInactive,
  onToggleInactive,
  children,
}: PageShellProps) {
  return (
    <div style={layout === 'master' ? masterStyle : transactionalStyle}>
      <div className="grid-toolbar">
        <div style={toolbarLeftStyle}>
          <PageTitle label={title} />
          <MenuMemoButton menuCode={menuCode} menuName={title} />
          {onToggleInactive && (
            <button onClick={onToggleInactive} className="mes-btn" style={{ fontSize: 12 }}>
              {hideInactive ? '미사용 제외' : '미사용 포함'}
            </button>
          )}
          {toolbar}
        </div>
        {toolbarRight && <div style={toolbarRightStyle}>{toolbarRight}</div>}
      </div>
      {children}
    </div>
  );
}
