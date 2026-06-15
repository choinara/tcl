export interface AdminUser {
  userId: number;
  loginId: string;
  userName: string;
  deptName?: string;
  position?: string;
  email?: string;
  employeeNumber?: string;
  status?: string;
  roleName?: string;
  createId?: string;
  createDt?: string;
  updateDt?: string;
}

export interface AdminUserFormData {
  loginId: string;
  userName: string;
  password?: string;
  passwordConfirm?: string;
  deptName: string;
  position: string;
  email: string;
  employeeNumber: string;
  status: string;
  roleId: string;
}
