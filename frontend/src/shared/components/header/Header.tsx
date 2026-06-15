import React from 'react';
import { ArrowLeft } from 'lucide-react';

export interface BreadcrumbItem {
  label: string;
  href?: string;
  onClick?: () => void;
}

export interface PageHeaderProps {
  title?: string;
  subtitle?: string;
  breadcrumbs?: BreadcrumbItem[];
  showBackButton?: boolean;
  onBack?: () => void;
  leftContent?: React.ReactNode;
  centerContent?: React.ReactNode;
  rightContent?: React.ReactNode;
  rightContentSx?: React.CSSProperties;
  bottomContent?: React.ReactNode;
  elevation?: number;
  backgroundColor?: string;
  fixed?: boolean;
  height?: number | string;
}

export const PageHeader: React.FC<PageHeaderProps> = ({
  title,
  subtitle,
  showBackButton = false,
  onBack,
  leftContent,
  centerContent,
  rightContent,
  rightContentSx,
  bottomContent,
  height,
}) => {
  const headerHeight = height !== undefined ? height : subtitle ? 52 : 40;

  return (
    <div
      className="bg-[var(--color-bg-primary)] text-[var(--color-text-primary)] border-b border-[var(--color-border)] flex items-center px-2.5 box-content"
      style={{ height: headerHeight }}
    >
      <div className="flex-1 flex items-center h-full">
        {showBackButton && (
          <button
            onClick={onBack}
            className="mr-5 rounded-[10px] border border-[var(--color-border)] w-10 h-10 flex items-center justify-center hover:bg-[var(--color-bg-hover)] transition-colors"
            aria-label="뒤로가기"
          >
            <ArrowLeft size={24} />
          </button>
        )}

        {leftContent ? (
          leftContent
        ) : (
          <div className="flex flex-col gap-0.5">
            {title && (
              <div className="flex flex-col gap-0.5">
                <span
                  className="font-bold text-[var(--color-text-primary)]"
                  style={{ fontSize: showBackButton || subtitle ? 'var(--font-size-lg)' : 'var(--font-size-xl)' }}
                >
                  {title}
                </span>
                {subtitle && (
                  <span className="text-sm text-[var(--color-text-disabled)]">{subtitle}</span>
                )}
              </div>
            )}
          </div>
        )}
      </div>

      {centerContent && <div className="flex-1 flex justify-center">{centerContent}</div>}

      {rightContent && (
        <div className="flex items-end gap-2 [&>*]:flex [&>*]:gap-2" style={rightContentSx}>
          {rightContent}
        </div>
      )}

      {bottomContent && <div className="border-t border-[var(--color-border)]">{bottomContent}</div>}
    </div>
  );
};

export default PageHeader;
