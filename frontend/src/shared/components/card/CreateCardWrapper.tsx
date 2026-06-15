import React from 'react';

interface CreateCardWrapperProps {
  children: React.ReactNode;
  title?: string;
  action?: React.ReactNode;
  sx?: React.CSSProperties;
  contentSx?: React.CSSProperties;
}

export const CreateCardWrapper = ({ children, title, action, sx, contentSx }: CreateCardWrapperProps) => {
  return (
    <div
      className="flex flex-col bg-[var(--color-bg-primary)] mx-auto rounded-[10px] border border-[var(--color-border)]"
      style={sx}
    >
      {title && (
        <div className="flex items-center justify-between h-[50px] border-b border-[var(--color-border)] px-5">
          <span className="text-base font-bold">{title}</span>
          {action && <div className="flex items-center">{action}</div>}
        </div>
      )}
      <div
        className="flex-1 flex flex-col gap-4 overflow-auto p-[20px_30px] last:[&]:pb-5"
        style={contentSx}
      >
        {children}
      </div>
    </div>
  );
};

export default CreateCardWrapper;
