export interface Menu {
  menuId: number;
  menuCode: string;
  menuName: string;
  menuPath?: string;
  parentMenuId?: number;
  parentMenuName?: string;
  icon?: string;
  visible?: string;
  sortOrder?: number;
  useYn?: string;
  children?: Menu[];
  createId?: string;
  createDt?: string;
  updateDt?: string;
}

export interface MenuFormData {
  menuCode: string;
  menuName: string;
  menuPath: string;
  parentMenuId: number | null;
  icon: string;
  visible: string;
  sortOrder: number;
  useYn: string;
}
