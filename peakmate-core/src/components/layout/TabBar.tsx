import { useState, useRef, useEffect, useCallback, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { useTabStore } from '@/stores/useTabStore';
import { usePreferenceStore, type FavoriteItem } from '@/stores/usePreferenceStore';

interface ContextMenu {
  x: number;
  y: number;
  path: string;
}

export function TabBar() {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const { tabs, activePath, setActive, removeTab, closeOthers, closeAll, closeRight, closeLeft, moveTab } =
    useTabStore();
  const [ctx, setCtx] = useState<ContextMenu | null>(null);
  const ctxRef = useRef<HTMLDivElement>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(false);
  const [dragOverPath, setDragOverPath] = useState<string | null>(null);
  const dragSourceRef = useRef<string | null>(null);

  // 즐겨찾기 표시용
  const favoritesRaw = usePreferenceStore((s) => s.prefs['pm-favorites'] ?? '');
  const favPaths = useMemo(() => {
    if (!favoritesRaw) return new Set<string>();
    try {
      const favs: FavoriteItem[] = JSON.parse(favoritesRaw);
      return new Set(favs.map(f => f.path));
    } catch { return new Set<string>(); }
  }, [favoritesRaw]);

  // 스크롤 가능 여부 감지
  const updateScrollState = useCallback(() => {
    const el = scrollRef.current;
    if (!el) return;
    setCanScrollLeft(el.scrollLeft > 1);
    setCanScrollRight(el.scrollLeft < el.scrollWidth - el.clientWidth - 1);
  }, []);

  // 스크롤 이벤트 + 리사이즈 감지
  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;

    updateScrollState();
    el.addEventListener('scroll', updateScrollState);

    const ro = new ResizeObserver(updateScrollState);
    ro.observe(el);

    return () => {
      el.removeEventListener('scroll', updateScrollState);
      ro.disconnect();
    };
  }, [updateScrollState]);

  // 탭 목록 변경 시 스크롤 상태 갱신
  useEffect(() => {
    updateScrollState();
  }, [tabs.length, updateScrollState]);

  // 활성 탭이 변경되면 해당 탭으로 자동 스크롤
  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;

    const activeTab = el.querySelector('.tab-item.active') as HTMLElement | null;
    if (!activeTab) return;

    const containerLeft = el.scrollLeft;
    const containerRight = containerLeft + el.clientWidth;
    const tabLeft = activeTab.offsetLeft;
    const tabRight = tabLeft + activeTab.offsetWidth;

    if (tabLeft < containerLeft) {
      el.scrollTo({ left: tabLeft, behavior: 'smooth' });
    } else if (tabRight > containerRight) {
      el.scrollTo({ left: tabRight - el.clientWidth, behavior: 'smooth' });
    }
  }, [activePath, tabs.length]);

  const scrollBy = (direction: number) => {
    scrollRef.current?.scrollBy({ left: direction * 150, behavior: 'smooth' });
  };

  const handleTabClick = (path: string) => {
    setActive(path);
    navigate(path);
  };

  const handleClose = (e: React.MouseEvent, path: string) => {
    e.stopPropagation();
    const nextPath = removeTab(path);
    if (nextPath) navigate(nextPath);
  };

  const handleContextMenu = (e: React.MouseEvent, path: string) => {
    e.preventDefault();
    setCtx({ x: e.clientX, y: e.clientY, path });
  };

  const handleMiddleClick = (e: React.MouseEvent, path: string) => {
    if (e.button === 1) {
      e.preventDefault();
      const nextPath = removeTab(path);
      if (nextPath) navigate(nextPath);
    }
  };

  const handleDragStart = useCallback((e: React.DragEvent, path: string) => {
    dragSourceRef.current = path;
    e.dataTransfer.effectAllowed = 'move';
    const target = e.currentTarget as HTMLElement;
    e.dataTransfer.setDragImage(target, target.offsetWidth / 2, target.offsetHeight / 2);
  }, []);

  const handleDragOver = useCallback((e: React.DragEvent, path: string) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    setDragOverPath(path);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent, path: string) => {
    e.preventDefault();
    const from = dragSourceRef.current;
    if (from && from !== path) {
      moveTab(from, path);
    }
    dragSourceRef.current = null;
    setDragOverPath(null);
  }, [moveTab]);

  const handleDragEnd = useCallback(() => {
    dragSourceRef.current = null;
    setDragOverPath(null);
  }, []);

  const closeContextMenu = useCallback(() => setCtx(null), []);

  useEffect(() => {
    if (!ctx) return;
    const handleClick = (e: MouseEvent) => {
      if (ctxRef.current && !ctxRef.current.contains(e.target as Node)) {
        closeContextMenu();
      }
    };
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, [ctx, closeContextMenu]);

  const ctxAction = (action: () => string | void) => {
    const result = action();
    closeContextMenu();
    if (typeof result === 'string') navigate(result);
  };

  if (tabs.length === 0) return null;

  return (
    <div className="tab-bar">
      {canScrollLeft && (
        <button
          className="tab-scroll-btn tab-scroll-left"
          onClick={() => scrollBy(-1)}
          aria-label={t('tab.scrollLeft')}
        >
          <ChevronLeft size={16} aria-hidden="true" />
        </button>
      )}

      <div className="tab-bar-scroll" ref={scrollRef} role="tablist">
        {tabs.map((tab) => (
          <div
            key={tab.path}
            role="tab"
            aria-selected={tab.path === activePath}
            draggable
            onDragStart={(e) => handleDragStart(e, tab.path)}
            onDragOver={(e) => handleDragOver(e, tab.path)}
            onDrop={(e) => handleDrop(e, tab.path)}
            onDragEnd={handleDragEnd}
            className={`tab-item ${tab.path === activePath ? 'active' : ''} ${favPaths.has(tab.path) ? 'favorite' : ''} ${dragOverPath === tab.path && dragSourceRef.current !== tab.path ? 'drag-over' : ''}`}
            onClick={() => handleTabClick(tab.path)}
            onContextMenu={(e) => handleContextMenu(e, tab.path)}
            onMouseDown={(e) => handleMiddleClick(e, tab.path)}
            tabIndex={tab.path === activePath ? 0 : -1}
          >
            <span className="tab-label">{tab.label}</span>
            {tabs.length > 1 && (
              <button
                className="tab-close"
                onClick={(e) => handleClose(e, tab.path)}
                title={t('tab.close')}
                aria-label={`${tab.label} ${t('tab.close')}`}
              >
                <span aria-hidden="true">×</span>
              </button>
            )}
          </div>
        ))}
      </div>

      {canScrollRight && (
        <button
          className="tab-scroll-btn tab-scroll-right"
          onClick={() => scrollBy(1)}
          aria-label={t('tab.scrollRight')}
        >
          <ChevronRight size={16} aria-hidden="true" />
        </button>
      )}

      {ctx && (
        <div
          ref={ctxRef}
          className="tab-context-menu"
          style={{ left: ctx.x, top: ctx.y }}
        >
          <button onClick={() => ctxAction(() => { const r = removeTab(ctx.path); return r ?? undefined; })}>
            {t('tab.close')}
          </button>
          <button onClick={() => ctxAction(() => { closeOthers(ctx.path); navigate(ctx.path); })}>
            {t('tab.closeOthers')}
          </button>
          <button onClick={() => ctxAction(() => closeAll())}>
            {t('tab.closeAll')}
          </button>
          <div className="tab-context-divider" />
          <button onClick={() => ctxAction(() => { closeLeft(ctx.path); })}>
            {t('tab.closeLeft')}
          </button>
          <button onClick={() => ctxAction(() => { closeRight(ctx.path); })}>
            {t('tab.closeRight')}
          </button>
        </div>
      )}
    </div>
  );
}
