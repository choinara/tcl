import { ChevronDown, ChevronUp } from 'lucide-react';

export interface FilterToggleButtonProps {
  open: boolean;
  onToggle: (open: boolean) => void;
}

export const FilterToggleButton = ({ open, onToggle }: FilterToggleButtonProps) => (
  <button
    type="button"
    onClick={() => onToggle(!open)}
    className="flex items-center gap-1 text-sm text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] transition-colors bg-transparent border-none cursor-pointer"
  >
    {open ? '필터 닫기' : '필터 열기'}
    {open ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
  </button>
);

export default FilterToggleButton;
