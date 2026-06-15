export interface Department {
  deptId: number;
  deptCode: string;
  deptName: string;
  parentDeptId?: number;
  parentDeptName?: string;
  managerName?: string;
  phone?: string;
  sortOrder?: number;
  useYn?: string;
  children?: Department[];
  createId?: string;
  createDt?: string;
  updateDt?: string;
}

export interface DepartmentFormData {
  deptCode: string;
  deptName: string;
  parentDeptId: number | null;
  managerName: string;
  phone: string;
  sortOrder: number;
  useYn: string;
}
