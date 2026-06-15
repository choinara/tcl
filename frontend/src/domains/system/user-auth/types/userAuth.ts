export interface UserAuthException {
  userId: number;
  loginId: string;
  userName: string;
  deptName?: string;
  exceptions: MenuException[];
}

export interface MenuException {
  menuId: number;
  menuName: string;
  read: boolean;
  write: boolean;
  delete: boolean;
}
