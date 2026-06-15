export interface MenuAuthMatrix {
  menuId: number;
  menuName: string;
  menuPath?: string;
  permissions: MenuPermission[];
}

export interface MenuPermission {
  roleId: number;
  roleName: string;
  read: boolean;
  write: boolean;
  delete: boolean;
  viewPii: boolean;
}

export interface RoleSummary {
  roleId: number;
  roleName: string;
  roleCode: string;
}
