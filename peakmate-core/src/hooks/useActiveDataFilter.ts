import { useState, useCallback, useMemo } from 'react';

export function useActiveDataFilter<T extends { isActive?: string }>(
  data: T[],
  defaultHide = true,
) {
  const [hideInactive, setHideInactive] = useState(defaultHide);

  const toggleInactive = useCallback(() => {
    setHideInactive(prev => !prev);
  }, []);

  const filteredData = useMemo(
    () => (hideInactive ? data.filter(r => r.isActive === 'Y') : data),
    [data, hideInactive],
  );

  return { hideInactive, toggleInactive, filteredData } as const;
}
