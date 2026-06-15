export interface LinkedColumnEntry {
  seq: number;
  key: string;
  label: string;
  value: string;
}

// Q7 B안: 메뉴 단위 컬럼 설정 (value 없음)
export interface ColKeyEntry {
  seq: number;
  key: string;
  label: string;
}

export interface MenuColConfig {
  menuCode: string;
  colKeys: ColKeyEntry[];
}

export type LinkStatus = 'LINKED' | 'STANDALONE' | 'BROKEN';

export interface AssetInstanceRow {
  id?: number;
  _tempId?: string;
  instanceId: string;
  instanceName: string;
  typeCode?: string;
  locationFloor?: string;
  serialNumber?: string;
  status?: string;
  useYn?: string;
  linkedMenuCode?: string;
  linkedRecordId?: number;
  linkStatus: LinkStatus;
  linkedColumns: LinkedColumnEntry[];
  rowState?: 'created' | 'updated' | 'deleted';
}

export interface MenuOption {
  menuCode: string;
  menuName: string;
}

export interface ColumnDef {
  key: string;
  label: string;
}

export interface LinkResult {
  menuCode: string;
  recordId: number;
  columns: LinkedColumnEntry[];
}
