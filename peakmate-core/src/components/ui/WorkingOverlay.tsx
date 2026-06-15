import { useState, useEffect } from 'react';
import { useLoadingStore } from '@/stores/useLoadingStore';
import { usePreferenceStore } from '@/stores/usePreferenceStore';

const DELAY_MS = 300;

export function WorkingOverlay() {
  const isLoading = useLoadingStore(s => s.isLoading);
  const label = usePreferenceStore(s => s.getWorkingLabel());
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (!isLoading) {
      setVisible(false);
      return;
    }
    const timer = setTimeout(() => setVisible(true), DELAY_MS);
    return () => clearTimeout(timer);
  }, [isLoading]);

  if (!visible) return null;

  return (
    <div className="working-overlay-root">
      <div className="working-overlay-card">
        <span className="working-overlay-label">{label}</span>
      </div>
    </div>
  );
}
