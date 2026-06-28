export interface DevTask {
  id: number;
  taskCode: string;
  originalNo: string | null;
  taskName: string;
  taskGroup: string;
  devType: string;
  priority: string;
  status: string;
  phase: string | null;
  proposer: string | null;
  assignee: string | null;
  relatedMenuCode: string | null;
  description: string | null;
  completionCriteria: string | null;
  plannedStart: string | null;
  plannedEnd: string | null;
  actualStartDate: string | null;
  actualEndDate: string | null;
  progress: number;
  remarks: string | null;
  useYn: string;
  createdAt: string;
  updatedAt: string;
}

export interface DevTaskStats {
  total: number;
  byStatus: Record<string, number>;
  byGroup: GroupStat[];
}

export interface GroupStat {
  group: string;
  groupName: string;
  total: number;
  completed: number;
  rate: number;
}
