import React from 'react';
import Dialog from '../dialog/Dialog';
import { GrayButton, PrimaryButton } from '../button/CustomButton';

export interface DualListDialogProps {
  open: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  width?: string;
  height?: string;
  searchArea?: React.ReactNode;
  confirmLabel?: string;
  cancelLabel?: string;
  leftPanel: React.ReactNode;
  centerPanel: React.ReactNode;
  rightPanel: React.ReactNode;
}

export const DualListDialog: React.FC<DualListDialogProps> = ({
  open,
  onClose,
  onConfirm,
  title,
  width = '1000px',
  height = '600px',
  searchArea,
  confirmLabel = '저장',
  cancelLabel = '취소',
  leftPanel,
  centerPanel,
  rightPanel,
}) => {
  return (
    <Dialog
      open={open}
      onClose={onClose}
      title={title}
      hideActions
      width={width}
      height={height}
    >
      <div className="flex flex-col h-full gap-4 min-h-0 overflow-hidden">
        {searchArea && (
          <div className="flex gap-2 px-6 py-2 border-b border-[var(--color-border)]">
            {searchArea}
          </div>
        )}

        <div
          className="flex-1 grid gap-4 px-6 mt-5 min-h-0 overflow-hidden"
          style={{ gridTemplateColumns: 'minmax(300px, 1fr) auto minmax(300px, 1fr)' }}
        >
          <div className="flex flex-col min-h-0 min-w-0">{leftPanel}</div>
          {centerPanel}
          <div className="flex flex-col min-h-0 min-w-0">{rightPanel}</div>
        </div>

        <div className="flex justify-center items-center gap-2.5 px-6 py-2.5 border-t border-[var(--color-border)]">
          <GrayButton btnWidth={122} heightType="h40" onClick={onClose}>
            {cancelLabel}
          </GrayButton>
          <PrimaryButton btnWidth={122} heightType="h40" onClick={onConfirm}>
            {confirmLabel}
          </PrimaryButton>
        </div>
      </div>
    </Dialog>
  );
};

export default DualListDialog;
