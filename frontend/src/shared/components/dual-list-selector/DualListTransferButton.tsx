import { Plus } from 'lucide-react';

export interface DualListTransferButtonProps {
  onAdd?: () => void;
  addDisabled?: boolean;
}

export const DualListTransferButton = ({
  onAdd,
  addDisabled = true,
}: DualListTransferButtonProps) => {
  return (
    <div className="flex justify-center items-center">
      <button
        type="button"
        onClick={onAdd}
        disabled={addDisabled}
        className="w-10 h-[178px] flex items-center justify-center rounded border border-[var(--color-border)] bg-[var(--color-bg-primary)] hover:bg-[var(--color-bg-hover)] disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
      >
        <Plus size={20} />
      </button>
    </div>
  );
};

export default DualListTransferButton;
