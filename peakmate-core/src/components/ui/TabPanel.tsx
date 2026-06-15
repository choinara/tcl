import { useState, type ReactNode } from 'react';

interface Tab {
  key: string;
  label: string;
  content?: ReactNode;
}

interface TabPanelProps {
  tabs: Tab[];
  defaultTab?: string;
  children?: (activeTab: string) => ReactNode;
  /** 탭 바 우측에 렌더링할 요소 (검색창 등) */
  rightSlot?: ReactNode;
  /** localStorage 키 — 설정하면 마지막 선택 탭을 기억 */
  storageKey?: string;
}

export function TabPanel({ tabs, defaultTab, children, rightSlot, storageKey }: TabPanelProps) {
  const [activeTab, setActiveTab] = useState(() => {
    if (storageKey) {
      try {
        const saved = localStorage.getItem(storageKey);
        if (saved && tabs.some(t => t.key === saved)) return saved;
      } catch { /* 탭 상태 복원 실패 — 기본 탭으로 선택 */ }
    }
    return defaultTab || tabs[0]?.key || '';
  });

  const handleTabClick = (key: string) => {
    setActiveTab(key);
    if (storageKey) {
      try { localStorage.setItem(storageKey, key); } catch { /* 탭 상태 저장 실패 — 다음 세션에서 기본 탭으로 시작 */ }
    }
  };

  const activeContent = children
    ? children(activeTab)
    : tabs.find(t => t.key === activeTab)?.content;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', flex: 1, minHeight: 0 }}>
      <div
        role="tablist"
        style={{
          display: 'flex', alignItems: 'center', borderBottom: '2px solid var(--color-border, #e2e8f0)', marginBottom: 8,
        }}
      >
        {tabs.map(tab => (
          <button
            key={tab.key}
            role="tab"
            id={`tab-${tab.key}`}
            aria-selected={activeTab === tab.key}
            aria-controls={`tabpanel-${tab.key}`}
            onClick={() => handleTabClick(tab.key)}
            style={{
              padding: '6px 14px',
              border: 'none',
              borderBottom: activeTab === tab.key ? '2px solid var(--color-primary, #3b82f6)' : '2px solid transparent',
              marginBottom: -2,
              background: 'none',
              color: activeTab === tab.key ? 'var(--color-primary, #3b82f6)' : 'var(--color-text-secondary, #64748b)',
              fontWeight: activeTab === tab.key ? 600 : 400,
              fontSize: 'var(--font-size-base, 13px)',
              cursor: 'pointer',
            }}
          >
            {tab.label}
          </button>
        ))}
        {rightSlot && (
          <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: 8 }}>
            {rightSlot}
          </div>
        )}
      </div>
      <div
        role="tabpanel"
        id={`tabpanel-${activeTab}`}
        aria-labelledby={`tab-${activeTab}`}
        style={{ flex: 1, minHeight: 0, display: 'flex', flexDirection: 'column' }}
      >
        {activeContent}
      </div>
    </div>
  );
}
