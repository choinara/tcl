import { useState, useCallback, useEffect, useMemo, useRef, type ComponentType } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { SplitPanel } from '@/components/ui/SplitPanel';
import { TreeView, type TreeNode } from '@/components/ui/TreeView';
import { FormField } from '@/components/ui/FormField';
import { authFetch } from '@/lib/api';
import { loadI18nOverrides } from '@/i18n';
import { useAuthStore } from '@/stores/useAuthStore';
import type { ApiResponse } from '@/components/grid/types';
import { usePermission } from '@/hooks/usePermission';
import { PageTitle } from '@/components/ui/PageTitle';
import { useToast } from '@/shared/components/toast/ToastProvider';
import { useConfirm } from '@/components/ui/ConfirmDialog';
import {
  LayoutDashboard, CalendarDays, ClipboardList, Factory, Settings,
  ShoppingCart, Package, Wrench, ShieldCheck, Archive, Calculator,
  Search, Building2, Stamp, Truck, Users, BarChart3, FileText,
  Bell, KeyRound, Globe, Layers, Clock, FlaskConical, Tag, Inbox,
  DollarSign, Link2, Monitor, Zap, Thermometer, Droplet, Recycle,
  SlidersHorizontal, Star, type LucideProps,
} from 'lucide-react';
import { usePreferenceStore, type FavoriteItem } from '@/stores/usePreferenceStore';

interface Menu {
  id: number;
  menuCode: string;
  menuName: string;
  menuPath: string;
  parentId: number | null;
  sortOrder: number;
  icon: string;
  visible: boolean;
  children?: Menu[];
}

interface MenuForm {
  menuCode: string;
  menuName: string;
  menuPath: string;
  parentId: number | null;
  sortOrder: number;
  icon: string;
  visible: boolean;
}

const emptyForm: MenuForm = { menuCode: '', menuName: '', menuPath: '', parentId: null, sortOrder: 0, icon: '', visible: true };

function flattenMenuTree(tree: Menu[]): Menu[] {
  const result: Menu[] = [];
  function traverse(nodes: Menu[]) { for (const node of nodes) { result.push(node); if (node.children?.length) traverse(node.children); } }
  traverse(tree);
  return result;
}

function buildFilteredTree(menus: Menu[], showAll: boolean): TreeNode[] {
  // 1단계: 표시할 메뉴 결정
  let filtered: Menu[];
  if (showAll) {
    filtered = menus;
  } else {
    const menuMap = new Map<number, Menu>();
    menus.forEach(m => menuMap.set(m.id, m));
    function isAncestorHidden(m: Menu): boolean {
      if (!m.visible) return true;
      if (m.parentId && menuMap.has(m.parentId)) return isAncestorHidden(menuMap.get(m.parentId)!);
      return false;
    }
    const visibleIds = new Set<number>();
    menus.forEach(m => { if (!isAncestorHidden(m)) visibleIds.add(m.id); });
    filtered = menus.filter(m => visibleIds.has(m.id));
  }

  // 2단계: 같은 부모 내에서 정렬 — visible=true(sortOrder순) → visible=false(menuCode순)
  const sorted = [...filtered].sort((a, b) => {
    if (a.parentId !== b.parentId) return 0;
    if (a.visible !== b.visible) return a.visible ? -1 : 1;
    if (!a.visible && !b.visible) return a.menuCode.localeCompare(b.menuCode);
    return a.sortOrder - b.sortOrder;
  });

  // 3단계: 트리 구성
  const map = new Map<number, TreeNode>();
  const roots: TreeNode[] = [];
  sorted.forEach(m => { map.set(m.id, { id: m.id, label: m.menuName, children: [], data: m as unknown as Record<string, unknown> }); });
  sorted.forEach(m => { const node = map.get(m.id)!; if (m.parentId && map.has(m.parentId)) { map.get(m.parentId)!.children!.push(node); } else { roots.push(node); } });

  // 4단계: 루트도 동일 정렬
  roots.sort((a, b) => {
    const ma = filtered.find(m => m.id === a.id)!;
    const mb = filtered.find(m => m.id === b.id)!;
    if (ma.visible !== mb.visible) return ma.visible ? -1 : 1;
    if (!ma.visible && !mb.visible) return ma.menuCode.localeCompare(mb.menuCode);
    return ma.sortOrder - mb.sortOrder;
  });

  return roots;
}

function getParentOptions(menus: Menu[], excludeId?: number): { id: number; label: string; depth: number }[] {
  const result: { id: number; label: string; depth: number }[] = [];
  const map = new Map<number, Menu>();
  menus.forEach(m => map.set(m.id, m));
  function getDepth(menu: Menu): number { let depth = 0; let current = menu; while (current.parentId && map.has(current.parentId)) { depth++; current = map.get(current.parentId)!; } return depth; }
  function isDescendant(menuId: number, ancestorId: number): boolean { let current = map.get(menuId); while (current) { if (current.id === ancestorId) return true; if (!current.parentId) return false; current = map.get(current.parentId); } return false; }
  for (const menu of menus) { if (excludeId && (menu.id === excludeId || isDescendant(menu.id, excludeId))) continue; result.push({ id: menu.id, label: '\u00A0'.repeat(getDepth(menu) * 4) + menu.menuName, depth: getDepth(menu) }); }
  return result;
}

type LucideIcon = ComponentType<LucideProps>;

const iconOptions: { value: string; label: string; Icon: LucideIcon }[] = [
  { value: 'dashboard', label: '대시보드(차트)', Icon: LayoutDashboard },
  { value: 'calendar', label: '캘린더(일정)', Icon: CalendarDays },
  { value: 'clipboard', label: '클립보드(목록)', Icon: ClipboardList },
  { value: 'factory', label: '공장(생산)', Icon: Factory },
  { value: 'settings', label: '설정(톱니)', Icon: Settings },
  { value: 'shopping-cart', label: '쇼핑카트(영업)', Icon: ShoppingCart },
  { value: 'package', label: '패키지(구매)', Icon: Package },
  { value: 'wrench', label: '렌치(설비)', Icon: Wrench },
  { value: 'shield-check', label: '방패(품질)', Icon: ShieldCheck },
  { value: 'archive', label: '보관함(재고)', Icon: Archive },
  { value: 'calculator', label: '계산기(원가)', Icon: Calculator },
  { value: 'search', label: '돋보기(검사)', Icon: Search },
  { value: 'building', label: '건물(조직)', Icon: Building2 },
  { value: 'stamp', label: '결재(문서)', Icon: Stamp },
  { value: 'truck', label: '트럭(물류/출하)', Icon: Truck },
  { value: 'users', label: '사람들(인사)', Icon: Users },
  { value: 'bar-chart', label: '꺾은선(실적)', Icon: BarChart3 },
  { value: 'file-text', label: '파일(보고서)', Icon: FileText },
  { value: 'bell', label: '알림(공지)', Icon: Bell },
  { value: 'key', label: '열쇠(권한)', Icon: KeyRound },
  { value: 'globe', label: '지구(웹/글로벌)', Icon: Globe },
  { value: 'layers', label: '레이어(BOM)', Icon: Layers },
  { value: 'clock', label: '시계(일정/시간)', Icon: Clock },
  { value: 'flask', label: '플라스크(시험)', Icon: FlaskConical },
  { value: 'tag', label: '태그(분류)', Icon: Tag },
  { value: 'inbox', label: '수신함(접수)', Icon: Inbox },
  { value: 'dollar', label: '돈(매출/비용)', Icon: DollarSign },
  { value: 'link', label: '링크(연동)', Icon: Link2 },
  { value: 'monitor', label: '모니터(모니터링)', Icon: Monitor },
  { value: 'zap', label: '번개(자동화)', Icon: Zap },
  { value: 'thermometer', label: '온도계(환경)', Icon: Thermometer },
  { value: 'droplet', label: '물방울(약품)', Icon: Droplet },
  { value: 'recycle', label: '재활용(스크랩)', Icon: Recycle },
  { value: 'filter', label: '필터(여과)', Icon: SlidersHorizontal },
  { value: 'clipboard-list', label: '점검목록(체크)', Icon: ClipboardList },
];

function IconSelect({ value, onChange, noneLabel }: { value: string; onChange: (val: string) => void; noneLabel: string }) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => { const handler = (e: MouseEvent) => { if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false); }; document.addEventListener('mousedown', handler); return () => document.removeEventListener('mousedown', handler); }, []);
  const selected = iconOptions.find(o => o.value === value);
  return (
    <div ref={ref} style={{ position: 'relative' }}>
      <button type="button" onClick={() => setOpen(!open)} style={{ width: '100%', padding: '6px 10px', border: '1px solid #d1d5db', borderRadius: 4, fontSize: 14, background: '#fff', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 8, textAlign: 'left' }}>
        {selected ? (<><selected.Icon size={16} style={{ flexShrink: 0 }} /><span>{selected.label}</span></>) : (<span style={{ color: '#9ca3af' }}>{noneLabel}</span>)}
      </button>
      {open && (
        <div style={{ position: 'absolute', top: '100%', left: 0, right: 0, zIndex: 50, maxHeight: 260, overflowY: 'auto', background: '#fff', border: '1px solid #d1d5db', borderRadius: 4, marginTop: 2, boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}>
          <div onClick={() => { onChange(''); setOpen(false); }} style={{ padding: '6px 10px', cursor: 'pointer', fontSize: 13, color: '#9ca3af', borderBottom: '1px solid #f3f4f6', background: value === '' ? '#eff6ff' : undefined }} onMouseEnter={e => { if (value !== '') (e.currentTarget as HTMLElement).style.background = '#f9fafb'; }} onMouseLeave={e => { if (value !== '') (e.currentTarget as HTMLElement).style.background = ''; }}>{noneLabel}</div>
          {iconOptions.map(opt => (
            <div key={opt.value} onClick={() => { onChange(opt.value); setOpen(false); }} style={{ padding: '5px 10px', cursor: 'pointer', fontSize: 13, display: 'flex', alignItems: 'center', gap: 8, background: value === opt.value ? '#eff6ff' : undefined }} onMouseEnter={e => { if (value !== opt.value) (e.currentTarget as HTMLElement).style.background = '#f9fafb'; }} onMouseLeave={e => { if (value !== opt.value) (e.currentTarget as HTMLElement).style.background = value === opt.value ? '#eff6ff' : ''; }}>
              <opt.Icon size={16} style={{ flexShrink: 0, color: '#374151' }} /><span>{opt.label}</span>{value === opt.value && <span style={{ marginLeft: 'auto', color: '#3b82f6', fontSize: 12 }}>&#10003;</span>}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default function MenuManagementPage() {
  const perm = usePermission('SM0010');
  const { notify } = useToast();
  const { confirm: confirmDialog, ConfirmDialog } = useConfirm();
  const queryClient = useQueryClient();
  const fetchMenus = useAuthStore((s) => s.fetchMenus);
  const [selectedId, setSelectedId] = useState<number | string | undefined>();
  const [form, setForm] = useState<MenuForm>(emptyForm);
  const [isNew, setIsNew] = useState(false);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [showAll, setShowAll] = useState(false);

  const favoritesRaw = usePreferenceStore((s) => s.prefs['pm-favorites'] ?? '');
  const addFavorite = usePreferenceStore((s) => s.addFavorite);
  const removeFavorite = usePreferenceStore((s) => s.removeFavorite);
  const favPaths = useMemo(() => { if (!favoritesRaw) return new Set<string>(); try { const favs: FavoriteItem[] = JSON.parse(favoritesRaw); return new Set(favs.map(f => f.path)); } catch { /* 즐겨찾기 JSON 파싱 실패 — 빈 Set으로 폴백, 메뉴 트리 표시에 영향 없음 */ return new Set<string>(); } }, [favoritesRaw]);

  const { data: menusData } = useQuery<Menu[]>({ queryKey: ['system-menus'], queryFn: async () => { const res = await authFetch('/api/system/menus'); if (!res.ok) throw new Error('요청 처리에 실패했습니다.'); const json: ApiResponse<Menu[]> = await res.json(); return flattenMenuTree(json.data); }, staleTime: 30_000 });

  const menus = useMemo(() => menusData ?? [], [menusData]);
  const treeNodes = useMemo(() => buildFilteredTree(menus, showAll), [menus, showAll]);
  const parentOptions = useMemo(() => getParentOptions(menus, typeof selectedId === 'number' ? selectedId : undefined), [menus, selectedId]);

  const handleSelect = useCallback((node: TreeNode) => { setSelectedId(node.id); setIsNew(false); setErrors({}); const menu = node.data as unknown as Menu; setForm({ menuCode: menu.menuCode, menuName: menu.menuName, menuPath: menu.menuPath, parentId: menu.parentId, sortOrder: menu.sortOrder, icon: menu.icon || '', visible: menu.visible }); }, []);
  const handleAddRoot = useCallback(() => { setSelectedId(undefined); setIsNew(true); setForm(emptyForm); setErrors({}); }, []);
  const handleAddSibling = useCallback(() => { if (!selectedId) return; const selectedMenu = menus.find(m => m.id === selectedId); setSelectedId(undefined); setIsNew(true); setForm({ ...emptyForm, parentId: selectedMenu?.parentId ?? null, sortOrder: (selectedMenu?.sortOrder ?? 0) + 1 }); setErrors({}); }, [selectedId, menus]);
  const handleAddChild = useCallback(() => { if (!selectedId) return; const children = menus.filter(m => m.parentId === selectedId); const maxSort = children.reduce((max, c) => Math.max(max, c.sortOrder), 0); setIsNew(true); setForm({ ...emptyForm, parentId: typeof selectedId === 'number' ? selectedId : null, sortOrder: maxSort + 1 }); setSelectedId(undefined); setErrors({}); }, [selectedId, menus]);
  const handleChange = useCallback((field: keyof MenuForm, value: string | number | boolean | null) => { setForm(prev => ({ ...prev, [field]: value })); setErrors(prev => ({ ...prev, [field]: '' })); }, []);

  const validate = useCallback((): boolean => {
    const newErrors: Record<string, string> = {};
    if (!form.menuCode.trim()) newErrors.menuCode = '메뉴코드는 필수입니다.';
    if (!form.menuName.trim()) newErrors.menuName = '메뉴명은 필수입니다.';
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }, [form]);

  const handleSave = useCallback(async () => { if (!validate()) return; setSaving(true); try { const url = isNew ? '/api/system/menus' : `/api/system/menus/${selectedId}`; const method = isNew ? 'POST' : 'PUT'; const body: Record<string, unknown> = { ...form }; const res = await authFetch(url, { method, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) }); if (!res.ok) throw new Error('요청 처리에 실패했습니다.'); await queryClient.invalidateQueries({ queryKey: ['system-menus'] }); await fetchMenus(); loadI18nOverrides().catch(() => {}); notify(isNew ? '등록되었습니다' : '수정되었습니다', { type: 'success' }); if (isNew) { setIsNew(false); setForm(emptyForm); } } catch (err) { notify('저장에 실패했습니다: ' + (err instanceof Error ? err.message : String(err)), { type: 'error' }); } finally { setSaving(false); } }, [form, isNew, selectedId, queryClient, fetchMenus, validate, notify]);

  const handleDelete = useCallback(async () => { if (!selectedId) return; const hasChildren = menus.some(m => m.parentId === selectedId); if (hasChildren) { notify('하위 메뉴가 존재합니다. 하위 메뉴를 먼저 삭제하세요.', { type: 'warning' }); return; } if (!await confirmDialog('삭제하시겠습니까?')) return; setDeleting(true); try { const res = await authFetch(`/api/system/menus/${selectedId}`, { method: 'DELETE' }); if (!res.ok) throw new Error('요청 처리에 실패했습니다.'); await queryClient.invalidateQueries({ queryKey: ['system-menus'] }); setSelectedId(undefined); setForm(emptyForm); setIsNew(false); notify('삭제되었습니다', { type: 'success' }); } catch (err) { notify('삭제에 실패했습니다: ' + (err instanceof Error ? err.message : String(err)), { type: 'error' }); } finally { setDeleting(false); } }, [selectedId, menus, queryClient, confirmDialog, notify]);

  useEffect(() => { if (!isNew && selectedId) { const menu = menus.find(m => m.id === selectedId); if (menu) { setForm({ menuCode: menu.menuCode, menuName: menu.menuName, menuPath: menu.menuPath, parentId: menu.parentId, sortOrder: menu.sortOrder, icon: menu.icon || '', visible: menu.visible }); } } }, [menus, selectedId, isNew]);

  const handleReorder = useCallback(async (nodeId: number | string, targetParentId: number | string | null, newIndex: number) => { const isSameParent = (a: number | null, b: number | string | null) => { const na = a ?? null; const nb = (b === 0 || b === undefined) ? null : b; return na === nb; }; const siblings = menus.filter(m => isSameParent(m.parentId, targetParentId)).sort((a, b) => a.sortOrder - b.sortOrder); const filtered = siblings.filter(s => s.id !== nodeId); const draggedMenu = menus.find(m => m.id === nodeId); if (!draggedMenu) return; const insertIdx = Math.min(newIndex, filtered.length); filtered.splice(insertIdx, 0, draggedMenu); try { for (let i = 0; i < filtered.length; i++) { if (filtered[i].sortOrder !== i + 1 || filtered[i].id === nodeId) { await authFetch(`/api/system/menus/${filtered[i].id}`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ ...filtered[i], parentId: targetParentId ?? null, sortOrder: i + 1 }) }); } } await queryClient.invalidateQueries({ queryKey: ['system-menus'] }); } catch (err) { notify('순서 변경 실패: ' + (err instanceof Error ? err.message : String(err)), { type: 'error' }); } }, [menus, queryClient, notify]);

  const renderTreeActions = useCallback((node: TreeNode) => { const menu = node.data as unknown as Menu; const isFav = menu.menuPath ? favPaths.has(menu.menuPath) : false; return (<div style={{ display: 'flex', gap: 3, alignItems: 'center' }} onClick={e => e.stopPropagation()}>{!menu.visible && (<span style={{ fontSize: 10, color: '#9ca3af', border: '1px solid #d1d5db', borderRadius: 3, padding: '0 4px', lineHeight: '16px' }}>숨김</span>)}{menu.menuPath && (<button onClick={() => { if (isFav) { removeFavorite(menu.menuPath); } else { if (!addFavorite(menu.menuPath, menu.menuName)) { notify('즐겨찾기는 최대 개수에 도달했습니다', { type: 'warning' }); } } }} title={isFav ? '즐겨찾기 해제' : '즐겨찾기 추가'} style={{ display: 'inline-flex', alignItems: 'center', padding: '1px 4px', border: '1px solid ' + (isFav ? '#fbbf24' : '#d1d5db'), borderRadius: 3, background: isFav ? '#fffbeb' : '#fff', cursor: 'pointer' }}><Star size={12} fill={isFav ? '#f59e0b' : 'none'} stroke={isFav ? '#f59e0b' : '#9ca3af'} /></button>)}{perm.canCreate && (<button onClick={() => { setIsNew(true); setSelectedId(undefined); const siblings = menus.filter(m => m.parentId === menu.parentId); const maxSort = siblings.reduce((max, c) => Math.max(max, c.sortOrder), 0); setForm({ ...emptyForm, parentId: menu.parentId, sortOrder: maxSort + 1 }); }} style={{ padding: '1px 6px', fontSize: 11, border: '1px solid #93c5fd', borderRadius: 3, background: '#eff6ff', color: '#2563eb', cursor: 'pointer' }}>동일 레벨 추가</button>)}{perm.canCreate && (<button onClick={() => { const children = menus.filter(m => m.parentId === menu.id); const maxSort = children.reduce((max, c) => Math.max(max, c.sortOrder), 0); setIsNew(true); setSelectedId(undefined); setForm({ ...emptyForm, parentId: menu.id, sortOrder: maxSort + 1 }); }} style={{ padding: '1px 6px', fontSize: 11, border: '1px solid #86efac', borderRadius: 3, background: '#f0fdf4', color: '#16a34a', cursor: 'pointer' }}>하위메뉴 추가</button>)}{perm.canDelete && (<button onClick={async () => { const hasChildren = menus.some(m => m.parentId === node.id); if (hasChildren) { notify('하위 메뉴가 존재합니다. 하위 메뉴를 먼저 삭제하세요.', { type: 'warning' }); return; } if (!await confirmDialog('삭제하시겠습니까?')) return; try { const res = await authFetch(`/api/system/menus/${node.id}`, { method: 'DELETE' }); if (!res.ok) throw new Error('요청 처리에 실패했습니다.'); await queryClient.invalidateQueries({ queryKey: ['system-menus'] }); if (selectedId === node.id) { setSelectedId(undefined); setForm(emptyForm); setIsNew(false); } } catch (err) { notify('삭제에 실패했습니다: ' + (err instanceof Error ? err.message : String(err)), { type: 'error' }); } }} style={{ padding: '1px 6px', fontSize: 11, border: '1px solid #fca5a5', borderRadius: 3, background: '#fef2f2', color: '#dc2626', cursor: 'pointer' }}>삭제</button>)}</div>); }, [menus, selectedId, queryClient, perm, favPaths, addFavorite, removeFavorite, confirmDialog, notify]);

  const leftPanel = (<div><div className="grid-toolbar" style={{ marginBottom: 8 }}><h3 style={{ margin: 0, fontSize: 14, fontWeight: 600 }}>메뉴 트리</h3><div style={{ display: 'flex', gap: 4 }}><button onClick={() => setShowAll(prev => !prev)} className="mes-btn">{showAll ? '미사용 안보기' : '미사용도 보기'}</button>{perm.canCreate && selectedId && (<><button className="px-3 py-1.5 text-sm bg-green-600 text-white rounded-md hover:bg-green-700" onClick={handleAddSibling}>동일 레벨 추가</button><button className="px-3 py-1.5 text-sm bg-emerald-600 text-white rounded-md hover:bg-emerald-700" onClick={handleAddChild}>하위 추가</button></>)}{perm.canCreate && (<button className="mes-btn mes-btn-new" onClick={handleAddRoot}>대분류 추가</button>)}</div></div><TreeView nodes={treeNodes} onSelect={handleSelect} selectedId={selectedId} renderActions={renderTreeActions} onReorder={handleReorder} defaultExpanded={false} /></div>);

  const rightPanel = (<div><h3 style={{ margin: '0 0 12px', fontSize: 14, fontWeight: 600 }}>{isNew ? '메뉴 등록' : selectedId ? '메뉴 상세' : '메뉴를 선택하세요'}</h3>{(isNew || selectedId) && (<><FormField label="메뉴코드" required value={form.menuCode} onChange={(e) => handleChange('menuCode', e.target.value)} placeholder="메뉴코드" error={errors.menuCode} /><FormField label="메뉴명" required value={form.menuName} onChange={(e) => handleChange('menuName', e.target.value)} placeholder="메뉴명" error={errors.menuName} /><FormField label="메뉴경로" value={form.menuPath} onChange={(e) => handleChange('menuPath', e.target.value)} placeholder="App.tsx의 Route path 값 입력 (예: /system/menus)" /><div style={{ marginBottom: 12 }}><label style={{ display: 'block', fontSize: 13, fontWeight: 500, color: '#374151', marginBottom: 4 }}>상위 메뉴</label><select value={form.parentId ?? ''} onChange={(e) => handleChange('parentId', e.target.value ? Number(e.target.value) : null)} style={{ width: '100%', padding: '6px 10px', border: '1px solid #d1d5db', borderRadius: 4, fontSize: 14 }}><option value="">없음 (최상위)</option>{parentOptions.map(opt => (<option key={opt.id} value={opt.id}>{opt.label}</option>))}</select></div><div style={{ marginBottom: 12 }}><label style={{ display: 'block', fontSize: 13, fontWeight: 500, color: '#374151', marginBottom: 4 }}>아이콘</label><IconSelect value={form.icon} onChange={(val) => handleChange('icon', val)} noneLabel="없음" /></div><div style={{ marginBottom: 12 }}><label style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, fontWeight: 500, color: '#374151' }}><input type="checkbox" checked={form.visible} onChange={(e) => handleChange('visible', e.target.checked)} />표시 여부</label></div><div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8, marginTop: 16 }}>{!isNew && selectedId && perm.canDelete && (<button onClick={handleDelete} disabled={deleting} className="mes-btn mes-btn-delete" style={{ padding: '6px 16px', fontSize: 14, opacity: deleting ? 0.6 : 1 }}>{deleting ? '삭제 중...' : '삭제'}</button>)}{(isNew ? perm.canCreate : perm.canUpdate) && (<button onClick={handleSave} disabled={saving} className="mes-btn mes-btn-save" style={{ padding: '6px 16px', fontSize: 14, opacity: saving ? 0.6 : 1 }}>{saving ? '저장 중...' : '저장'}</button>)}</div></>)}</div>);

  return (<div><div className="grid-toolbar"><PageTitle /></div><SplitPanel left={leftPanel} right={rightPanel} leftWidth="40%" /><ConfirmDialog /></div>);
}
