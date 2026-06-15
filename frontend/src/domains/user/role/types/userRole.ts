export interface UserRoleAssignment {
  userId: number;
  loginId: string;
  userName: string;
  deptName?: string;
  roleId?: number;
  roleName?: string;
  assigned: boolean;
}

export interface RoleInfo {
  roleId: number;
  roleName: string;
  roleCode: string;
  description?: string;
  userCount?: number;
}
