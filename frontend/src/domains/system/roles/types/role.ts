export interface Role {
  roleId: number;
  roleName: string;
  roleCode?: string;
  description?: string;
  userCount?: number;
  useYn?: string;
  createId?: string;
  createDt?: string;
  updateDt?: string;
}

export interface RoleFormData {
  roleName: string;
  roleCode: string;
  description: string;
  useYn: string;
}
