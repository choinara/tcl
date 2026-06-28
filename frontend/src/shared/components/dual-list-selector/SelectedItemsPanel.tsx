import React from 'react';
import { ArrowUpToLine, ArrowUp, ArrowDown, ArrowDownToLine, Trash2 } from 'lucide-react';
import { GhostButton } from '../button/CustomButton';

export interface SelectedItemsPanelProps<T extends Record<string, unknown>> {
  items: T[];
  getItemId: (item: T) => number;
  selectedIds: Set<number>;
  onSelectionChange: (ids: Set<number>) => void;
  onRemove: (ids: number[]) => void;
  onReorder?: (items: T[]) => void;
  children: React.ReactNode;
  resource: string;
  emptyMessage?: string | React.ReactNode;
  empty?: React.ReactNode;
}

const ReorderActionButtons = ({
  onMoveToTop,
  onMoveUp,
  onMoveDown,
  onMoveToBottom,
  onDelete,
  disabled,
  showReorder = true,
}: {
  onMoveToTop?: () => void;
  onMoveUp?: () => void;
  onMoveDown?: () => void;
  onMoveToBottom?: () => void;
  onDelete?: () => void;
  disabled: boolean;
  showReorder?: boolean;
}) => (
  <div className="flex items-center justify-between w-full">
    {showReorder && (
      <div className="flex gap-0.5">
        <GhostButton startIcon={<ArrowUpToLine size={18} />} iconOnly disabled={disabled} onClick={onMoveToTop} title="제일 위로" />
        <GhostButton startIcon={<ArrowUp size={18} />} iconOnly disabled={disabled} onClick={onMoveUp} title="위로" />
        <GhostButton startIcon={<ArrowDown size={18} />} iconOnly disabled={disabled} onClick={onMoveDown} title="아래로" />
        <GhostButton startIcon={<ArrowDownToLine size={18} />} iconOnly disabled={disabled} onClick={onMoveToBottom} title="제일 아래로" />
      </div>
    )}
    <div>
      <GhostButton startIcon={<Trash2 size={18} />} disabled={disabled} onClick={onDelete}>
        삭제
      </GhostButton>
    </div>
  </div>
);

export const SelectedItemsPanel = React.forwardRef<
  HTMLDivElement,
  SelectedItemsPanelProps<Record<string, unknown>>
>(
  (
    {
      items,
      getItemId,
      selectedIds,
      onSelectionChange,
      onRemove,
      onReorder,
      children,
      resource: _res,
      emptyMessage = '선택된 항목이 없습니다',
      empty,
    },
    ref
  ) => {
    void _res;
    const handleToggleItem = (id: number) => {
      const newIds = new Set(selectedIds);
      if (newIds.has(id)) newIds.delete(id);
      else newIds.add(id);
      onSelectionChange(newIds);
    };

    const handleSelectAll = () => {
      onSelectionChange(new Set(items.map((item) => getItemId(item))));
    };

    const handleRemoveSelected = () => {
      onRemove(Array.from(selectedIds));
      onSelectionChange(new Set());
    };

    const getSelectedIndices = () =>
      Array.from(selectedIds)
        .map((id) => items.findIndex((item) => getItemId(item) === id))
        .filter((idx) => idx !== -1)
        .sort((a, b) => a - b);

    const handleMoveUp = () => {
      const indices = getSelectedIndices();
      if (indices.length === 0 || indices[0] <= 0) return;
      const newItems = [...items];
      indices.forEach((idx) => {
        [newItems[idx - 1], newItems[idx]] = [newItems[idx], newItems[idx - 1]];
      });
      onReorder?.(newItems);
    };

    const handleMoveDown = () => {
      const indices = getSelectedIndices();
      if (indices.length === 0 || indices[indices.length - 1] >= items.length - 1) return;
      const newItems = [...items];
      for (let i = indices.length - 1; i >= 0; i--) {
        const idx = indices[i];
        [newItems[idx], newItems[idx + 1]] = [newItems[idx + 1], newItems[idx]];
      }
      onReorder?.(newItems);
    };

    const handleMoveToTop = () => {
      const indices = getSelectedIndices();
      if (indices.length === 0 || indices[0] <= 0) return;
      const selectedItems = indices.map((idx) => items[idx]);
      const rest = items.filter((_, idx) => !indices.includes(idx));
      onReorder?.([...selectedItems, ...rest]);
    };

    const handleMoveToBottom = () => {
      const indices = getSelectedIndices();
      if (indices.length === 0 || indices[indices.length - 1] >= items.length - 1) return;
      const selectedItems = indices.map((idx) => items[idx]);
      const rest = items.filter((_, idx) => !indices.includes(idx));
      onReorder?.([...rest, ...selectedItems]);
    };

    const allSelected = items.length > 0 && selectedIds.size === items.length;

    return (
      <div ref={ref} className="flex-1 flex flex-col h-full">
        <div className="mb-3 flex justify-between items-center gap-4 shrink-0">
          <ReorderActionButtons
            onMoveToTop={handleMoveToTop}
            onMoveUp={handleMoveUp}
            onMoveDown={handleMoveDown}
            onMoveToBottom={handleMoveToBottom}
            onDelete={handleRemoveSelected}
            disabled={selectedIds.size === 0}
            showReorder={!!onReorder}
          />
        </div>

        {items.length === 0 ? (
          empty ? (
            empty
          ) : (
            <div className="flex-1 border border-[var(--color-border)] rounded flex items-center justify-center text-[var(--color-text-secondary)]">
              {emptyMessage}
            </div>
          )
        ) : (
          <div className="flex-1 overflow-auto min-h-0 border border-[var(--color-border)] rounded">
            <table className="w-full text-sm">
              <thead className="sticky top-0 bg-[var(--color-bg-secondary)] border-b border-[var(--color-border)]">
                <tr>
                  <th className="w-10 px-2 py-2 text-center">
                    <input
                      type="checkbox"
                      checked={allSelected}
                      onChange={() => allSelected ? onSelectionChange(new Set()) : handleSelectAll()}
                      className="accent-[var(--color-primary)]"
                    />
                  </th>
                  {React.Children.map(children, (child) => {
                    if (!React.isValidElement(child)) return null;
                    const props = child.props as Record<string, unknown>;
                    return (
                      <th className="px-3 py-2 text-left font-medium text-[var(--color-text-secondary)]">
                        {String(props.label || props.source || '')}
                      </th>
                    );
                  })}
                </tr>
              </thead>
              <tbody>
                {items.map((item) => {
                  const id = getItemId(item);
                  const isSelected = selectedIds.has(id);
                  return (
                    <tr
                      key={id}
                      onClick={() => handleToggleItem(id)}
                      className={`cursor-pointer border-b border-[var(--color-border)] hover:bg-[var(--color-bg-hover)] ${isSelected ? 'bg-[var(--color-primary)]/5' : ''}`}
                    >
                      <td className="w-10 px-2 py-2 text-center">
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={() => handleToggleItem(id)}
                          onClick={(e) => e.stopPropagation()}
                          className="accent-[var(--color-primary)]"
                        />
                      </td>
                      {React.Children.map(children, (child) => {
                        if (!React.isValidElement(child)) return null;
                        const props = child.props as Record<string, unknown>;
                        const source = props.source;
                        const render = props.render;
                        return (
                          <td className="px-3 py-2 text-[var(--color-text-primary)]">
                            {typeof render === 'function' ? (render as (item: Record<string, unknown>) => React.ReactNode)(item) : (typeof source === 'string' ? String((item as Record<string, unknown>)[source] ?? '') : '')}
                          </td>
                        );
                      })}
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    );
  }
);

SelectedItemsPanel.displayName = 'SelectedItemsPanel';

export default SelectedItemsPanel;
