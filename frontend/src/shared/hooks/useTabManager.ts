import {useEffect} from 'react';
import {useLocation} from 'react-router-dom';
import type {Tab} from '@/shared/store/useTabStore.ts';
import {useTabStore} from '@/shared/store/useTabStore.ts';
import {allMenuItems} from '@/presenstation/layout/custom/menuItems.ts';

/**
 * 경로의 탭 제목 조회 (menuItems.ts에서 통합 관리)
 */
const getTabTitle = (path: string): string => {
  const item = allMenuItems.find(mi => mi.to === path);
  return item?.label || path;
};

/**
 * 경로에서 도메인(기본 경로)만 추출
 * /songs, /songs/create, /songs/123 → /songs
 */
const getBasePath = (pathname: string): string => {
  const parts = pathname.split('/').filter(Boolean);
  if (parts.length === 0) return '/';
  return `/${parts[0]}`;
};

/**
 * 현재 경로에 해당하는 탭을 자동으로 추가/관리하는 훅
 * 같은 도메인의 경로들은 같은 탭으로 재활용됨
 */
export const useTabManager = () => {
  const location = useLocation();
  const { addTab, findTabByPath, updateTabFullPath } = useTabStore();

  // 탭 추가
  useEffect(() => {
    const currentPath = location.pathname;
    // 도메인(기본 경로)만 추출하여 탭 관리
    const basePath = getBasePath(currentPath);
    const existingTab = findTabByPath(basePath);

    // 이미 존재하는 탭이면 활성화만
    if (existingTab) {
      return;
    }

    // 새 탭 추가
    const title = getTabTitle(basePath);
    const fullPath = location.pathname + location.search;
    const newTab: Tab = {
      id: `tab-${Date.now()}`,
      title,
      path: basePath,  // ← 도메인만 저장 (같은 도메인의 다른 경로는 재활용됨)
      fullPath,
      closable: true,
    };

    addTab(newTab);
  }, [location.pathname, addTab, findTabByPath]);

  // URL 변경 시 fullPath 업데이트 (페이지네이션 등)
  useEffect(() => {
    const currentPath = location.pathname;
    const basePath = getBasePath(currentPath);
    const fullPath = location.pathname + location.search;
    updateTabFullPath(basePath, fullPath);
  }, [location.pathname, location.search, updateTabFullPath]);
};
