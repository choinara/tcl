import { useState } from 'react';
import Input from '@/shared/components/input/Input';
import { FilterSearchButton, FilterResetButton } from '@/shared/components/button/CustomButton';
import { LOG_FILTER_DEFAULTS, LOG_TYPE_CODES } from '../constants/logFilterDefaults';

interface SystemLogFilterFormProps {
  onSearch: (filters: Record<string, any>) => void;
}

const ToggleGroup = ({ options, value, onChange }: { options: { value: string; label: string }[]; value: string; onChange: (v: string) => void }) => (
  <div className="flex gap-1 flex-wrap">
    {options.map((opt) => (
      <button key={opt.value} type="button" onClick={() => onChange(value === opt.value ? '' : opt.value)}
        className={`px-3 py-1 text-xs rounded border transition-colors ${value === opt.value ? 'bg-[var(--color-primary)] text-white border-[var(--color-primary)]' : 'bg-[var(--color-bg-primary)] text-[var(--color-text-primary)] border-[var(--color-border)] hover:bg-[var(--color-bg-hover)]'}`}>
        {opt.label}
      </button>
    ))}
  </div>
);

export const SystemLogFilterForm = ({ onSearch }: SystemLogFilterFormProps) => {
  const [filters, setFilters] = useState(LOG_FILTER_DEFAULTS);

  const update = (key: string, value: any) => setFilters((prev: any) => ({ ...prev, [key]: value }));
  const handleSearch = () => onSearch(filters);
  const handleReset = () => { setFilters(LOG_FILTER_DEFAULTS); onSearch(LOG_FILTER_DEFAULTS); };

  return (
    <div className="border-b border-[var(--color-border)] bg-[var(--color-bg-secondary)]">
      <div className="flex items-stretch w-full">
        <div className="flex flex-col gap-2.5 flex-1 px-3 py-2.5">
          <div className="flex gap-5 items-center">
            <Input value={filters.keyword} onChange={(e: any) => update('keyword', e.target.value)} placeholder="사용자명 또는 액션으로 검색" heightType="h32" style={{ width: 300 }} onKeyDown={(e: any) => e.key === 'Enter' && handleSearch()} />
            <ToggleGroup options={LOG_TYPE_CODES} value={filters.logType} onChange={(v) => update('logType', v)} />
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

export default SystemLogFilterForm;
