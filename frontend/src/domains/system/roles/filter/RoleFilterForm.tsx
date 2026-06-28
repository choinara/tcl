import { useState } from 'react';
import Input from '@/shared/components/input/Input';
import { FilterSearchButton, FilterResetButton } from '@/shared/components/button/CustomButton';
import { ROLE_FILTER_DEFAULTS, USE_YN_CODES } from '../constants/roleOptions';

interface RoleFilterFormProps {
  onSearch: (filters: Record<string, string>) => void;
}

const ToggleGroup = ({ options, value, onChange }: { options: { value: string; label: string }[]; value: string; onChange: (v: string) => void }) => (
  <div className="flex gap-1">
    {options.map((opt) => (
      <button key={opt.value} type="button" onClick={() => onChange(value === opt.value ? '' : opt.value)}
        className={`px-3 py-1 text-xs rounded border transition-colors ${value === opt.value ? 'bg-[var(--color-primary)] text-white border-[var(--color-primary)]' : 'bg-[var(--color-bg-primary)] text-[var(--color-text-primary)] border-[var(--color-border)] hover:bg-[var(--color-bg-hover)]'}`}>
        {opt.label}
      </button>
    ))}
  </div>
);

export const RoleFilterForm = ({ onSearch }: RoleFilterFormProps) => {
  const [filters, setFilters] = useState(ROLE_FILTER_DEFAULTS);

  const update = (key: string, value: string) => setFilters((prev) => ({ ...prev, [key]: value }));
  const handleSearch = () => onSearch(filters);
  const handleReset = () => { setFilters(ROLE_FILTER_DEFAULTS); onSearch(ROLE_FILTER_DEFAULTS); };

  return (
    <div className="border-b border-[var(--color-border)] bg-[var(--color-bg-secondary)]">
      <div className="flex items-stretch w-full">
        <div className="flex flex-col gap-2.5 flex-1 px-3 py-2.5">
          <div className="flex gap-5 items-center">
            <Input value={filters.keyword} onChange={(v: string) => update('keyword', v)} placeholder="역할명으로 검색" heightType="h32" style={{ width: 300 }} onKeyDown={(e: React.KeyboardEvent) => e.key === 'Enter' && handleSearch()} />
            <ToggleGroup options={USE_YN_CODES} value={filters.useYn} onChange={(v) => update('useYn', v)} />
          </div>
        </div>
        <div className="flex gap-2 items-center px-3 py-2.5 border-l border-[var(--color-border)]">
          <FilterSearchButton onClick={handleSearch} />
          <FilterResetButton onClick={handleReset} />
        </div>
      </div>
    </div>
  );
};

export default RoleFilterForm;
