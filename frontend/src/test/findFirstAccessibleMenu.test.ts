import { describe, it, expect } from 'vitest';
import { findFirstAccessibleMenu } from '../../../peakmate-core/src/components/layout/menuUtils';
import type { MenuTreeNode, PermissionSet } from '../../../peakmate-core/src/stores/useAuthStore';

function makeNode(overrides: Partial<MenuTreeNode> & { menuCode: string; menuPath: string; menuName: string }): MenuTreeNode {
  return {
    id: 1,
    icon: 'file-text',
    sortOrder: 0,
    canRead: false,
    canCreate: false,
    canUpdate: false,
    canDelete: false,
    canExport: false,
    canViewPii: false,
    canApprove: false,
    children: [],
    ...overrides,
  };
}

function makePerm(canRead: boolean): PermissionSet {
  return { canRead, canCreate: false, canUpdate: false, canDelete: false, canExport: false, canViewPii: false, canApprove: false };
}

describe('findFirstAccessibleMenu', () => {
  it('MM/SM 프리픽스를 제외하고 canRead=true인 첫 메뉴를 반환한다', () => {
    const menus: MenuTreeNode[] = [
      makeNode({ menuCode: 'MM0010', menuPath: '/master/customer', menuName: '고객관리' }),
      makeNode({ menuCode: 'SM0010', menuPath: '/system/menu', menuName: '메뉴관리' }),
      makeNode({ menuCode: 'WH0010', menuPath: '/warehouse/pre-inbound', menuName: '가입고등록' }),
      makeNode({ menuCode: 'PD0010', menuPath: '/production/plan', menuName: '생산계획' }),
    ];
    const permissionMap: Record<string, PermissionSet> = {
      MM0010: makePerm(true),
      SM0010: makePerm(true),
      WH0010: makePerm(true),
      PD0010: makePerm(true),
    };

    const result = findFirstAccessibleMenu(menus, permissionMap);
    expect(result).not.toBeNull();
    expect(result!.menuCode).toBe('WH0010');
    expect(result!.path).toBe('/warehouse/pre-inbound');
    expect(result!.label).toBe('가입고등록');
  });

  it('canRead=false인 메뉴는 건너뛴다', () => {
    const menus: MenuTreeNode[] = [
      makeNode({ menuCode: 'WH0010', menuPath: '/warehouse/pre-inbound', menuName: '가입고등록' }),
      makeNode({ menuCode: 'PD0010', menuPath: '/production/plan', menuName: '생산계획' }),
    ];
    const permissionMap: Record<string, PermissionSet> = {
      WH0010: makePerm(false),
      PD0010: makePerm(true),
    };

    const result = findFirstAccessibleMenu(menus, permissionMap);
    expect(result!.menuCode).toBe('PD0010');
  });

  it('빈 메뉴 시 null 반환', () => {
    const result = findFirstAccessibleMenu([], {});
    expect(result).toBeNull();
  });

  it('모든 메뉴가 MM/SM이면 null 반환', () => {
    const menus: MenuTreeNode[] = [
      makeNode({ menuCode: 'MM0010', menuPath: '/master/customer', menuName: '고객관리' }),
      makeNode({ menuCode: 'SM0010', menuPath: '/system/menu', menuName: '메뉴관리' }),
    ];
    const permissionMap: Record<string, PermissionSet> = {
      MM0010: makePerm(true),
      SM0010: makePerm(true),
    };

    const result = findFirstAccessibleMenu(menus, permissionMap);
    expect(result).toBeNull();
  });

  it('children 내부 메뉴도 BFS로 탐색한다', () => {
    const menus: MenuTreeNode[] = [
      makeNode({
        menuCode: 'WH',
        menuPath: '',
        menuName: '창고관리',
        children: [
          makeNode({ menuCode: 'WH0010', menuPath: '/warehouse/pre-inbound', menuName: '가입고등록' }),
          makeNode({ menuCode: 'WH0020', menuPath: '/warehouse/inbound', menuName: '입고등록' }),
        ],
      }),
    ];
    const permissionMap: Record<string, PermissionSet> = {
      WH: makePerm(false),
      WH0010: makePerm(true),
      WH0020: makePerm(true),
    };

    const result = findFirstAccessibleMenu(menus, permissionMap);
    expect(result!.menuCode).toBe('WH0010');
    expect(result!.path).toBe('/warehouse/pre-inbound');
  });

  it('path가 "/" 인 대시보드는 건너뛴다', () => {
    const menus: MenuTreeNode[] = [
      makeNode({ menuCode: 'DASH', menuPath: '/', menuName: 'Dashboard' }),
      makeNode({ menuCode: 'WH0010', menuPath: '/warehouse/pre-inbound', menuName: '가입고등록' }),
    ];
    const permissionMap: Record<string, PermissionSet> = {
      DASH: makePerm(true),
      WH0010: makePerm(true),
    };

    const result = findFirstAccessibleMenu(menus, permissionMap);
    expect(result!.menuCode).toBe('WH0010');
  });
});
