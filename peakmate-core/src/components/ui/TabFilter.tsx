interface TabFilterItem<T extends string | number = string> {
  label: string;
  value: T;
}

interface TabFilterProps<T extends string | number = string> {
  tabs: TabFilterItem<T>[];
  value: T;
  onChange: (v: T) => void;
}

const containerStyle: React.CSSProperties = {
  display: 'inline-flex',
  gap: 2,
  background: 'var(--color-border, #e2e8f0)',
  borderRadius: 6,
  padding: 2,
};

function activeStyle(active: boolean): React.CSSProperties {
  return {
    padding: '3px 12px',
    borderRadius: 4,
    border: 'none',
    cursor: active ? 'default' : 'pointer',
    fontSize: 'var(--font-size-sm)',
    fontWeight: active ? 600 : 400,
    background: active ? 'var(--color-bg-white, #fff)' : 'transparent',
    color: active ? 'var(--color-text, #1e293b)' : 'var(--color-text-secondary, #6b7280)',
    boxShadow: active ? '0 1px 3px rgba(0,0,0,0.12)' : 'none',
    transition: 'all 0.15s',
    whiteSpace: 'nowrap',
  };
}

export function TabFilter<T extends string | number = string>({ tabs, value, onChange }: TabFilterProps<T>) {
  return (
    <div style={containerStyle}>
      {tabs.map(tab => (
        <button
          key={String(tab.value)}
          type="button"
          onClick={() => { if (tab.value !== value) onChange(tab.value); }}
          style={activeStyle(tab.value === value)}
        >
          {tab.label}
        </button>
      ))}
    </div>
  );
}
