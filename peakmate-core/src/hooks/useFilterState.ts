import { useState, useCallback } from 'react';

export function useFilterState<T extends Record<string, unknown>>(defaultValues: T) {
  const [filters, setFilters] = useState<T>(defaultValues);
  const [applied, setApplied] = useState<T>(defaultValues);

  const setFilter = useCallback(<K extends keyof T>(key: K, value: T[K]) => {
    setFilters((prev) => ({ ...prev, [key]: value }));
  }, []);

  const applyFilters = useCallback(() => {
    setFilters((current) => {
      setApplied(current);
      return current;
    });
  }, []);

  const resetFilters = useCallback(() => {
    setFilters(defaultValues);
    setApplied(defaultValues);
  }, [defaultValues]);

  return { filters, applied, setFilter, applyFilters, resetFilters };
}
