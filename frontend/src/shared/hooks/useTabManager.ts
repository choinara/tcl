import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import type { TabItem } from '@/stores/useTabStore';
import { useTabStore } from '@/stores/useTabStore';

const getBasePath = (pathname: string): string => {
  const parts = pathname.split('/').filter(Boolean);
  if (parts.length === 0) return '/';
  return `/${parts[0]}`;
};

export const useTabManager = () => {
  const location = useLocation();
  const { addTab, tabs } = useTabStore();

  useEffect(() => {
    const basePath = getBasePath(location.pathname);
    const exists = tabs.find((t: TabItem) => t.path === basePath);
    if (exists) return;

    addTab({ path: basePath, label: basePath });
  }, [location.pathname, location.search, addTab, tabs]);
};
