import type { ReactNode, CSSProperties } from 'react';
import { PageTitle } from '../ui/PageTitle';
import { GridFill } from './GridFill';

interface PageFilterShellProps {
  title: string;
  /** 현재는 미사용 — PageTitle이 URL 기반으로 menuCode를 자동 감지함. API 호환성용으로 보존. */
  menuCode?: string;
  toolbar?: ReactNode;
  toolbarRight?: ReactNode;
  filters?: ReactNode;
  children: ReactNode;
}

const shellStyle: CSSProperties = {
  display: 'flex', flexDirection: 'column', height: '100%', overflow: 'hidden', gap: 8,
};

const toolbarLeftStyle: CSSProperties = { display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap', minWidth: 0 };
const toolbarRightStyle: CSSProperties = { display: 'flex', gap: 6 };
const filtersStyle: CSSProperties = {
  display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap', flexShrink: 0,
};

export function PageFilterShell({
  title,
  toolbar,
  toolbarRight,
  filters,
  children,
}: PageFilterShellProps) {
  return (
    <div style={shellStyle}>
      <div className="grid-toolbar">
        <div style={toolbarLeftStyle}>
          <PageTitle label={title} />
          {toolbar}
        </div>
        {toolbarRight && <div style={toolbarRightStyle}>{toolbarRight}</div>}
      </div>
      {filters && <div style={filtersStyle}>{filters}</div>}
      <GridFill>{children}</GridFill>
    </div>
  );
}
