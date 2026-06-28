import { History, StickyNote } from 'lucide-react';
import { GhostButton } from '../button/CustomButton';

export type AsideType = 'history' | 'memo';

interface AsideButtonProps {
  record: Record<string, unknown>;
  onOpen: (type: AsideType, record: Record<string, unknown>) => void;
}

export const HistoryButton = ({ record, onOpen }: AsideButtonProps) => (
  <div className="flex justify-center">
    <GhostButton iconOnly startIcon={<History size={18} />} onClick={(e) => { e.stopPropagation(); onOpen('history', record); }} />
  </div>
);

export const MemoButton = ({ record, onOpen }: AsideButtonProps) => (
  <div className="flex justify-center">
    <GhostButton iconOnly startIcon={<StickyNote size={18} />} onClick={(e) => { e.stopPropagation(); onOpen('memo', record); }} />
  </div>
);
