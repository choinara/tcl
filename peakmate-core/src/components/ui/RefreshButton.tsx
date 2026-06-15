import { useState } from 'react';
import { RefreshCw } from 'lucide-react';
import { coreNotify } from '../../stores/useNotifyStore';

interface RefreshButtonProps {
  onRefresh: () => void | Promise<void>;
  label?: string;
  disabled?: boolean;
}

export function RefreshButton({ onRefresh, label, disabled }: RefreshButtonProps) {
  const [refreshing, setRefreshing] = useState(false);

  const handleClick = async () => {
    setRefreshing(true);
    try {
      await onRefresh();
    } catch {
      coreNotify('새로고침 중 오류가 발생했습니다', { type: 'error' });
    } finally {
      setRefreshing(false);
    }
  };

  return (
    <button
      type="button"
      onClick={handleClick}
      disabled={disabled || refreshing}
      className="mes-btn"
      title="새로고침"
      style={{ display: 'flex', alignItems: 'center', gap: 4 }}
    >
      <RefreshCw
        size={13}
        style={refreshing ? { animation: 'spin 0.6s linear infinite' } : undefined}
      />
      {label && <span>{refreshing ? '새로고침 중...' : label}</span>}
    </button>
  );
}
