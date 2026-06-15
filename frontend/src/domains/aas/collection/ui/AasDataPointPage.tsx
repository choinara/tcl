import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { AllCommunityModule, ModuleRegistry, type ColDef, type ICellRendererParams } from 'ag-grid-community';
import { authFetch } from '@/lib/api';
import { usePermission } from '@/hooks/usePermission';
import { useTranslation } from 'react-i18next';
import { useToast } from '@/shared/components/toast/ToastProvider';
import { useConfirm } from '@/components/ui/ConfirmDialog';
import { PageTitle } from '@/components/ui/PageTitle';
import { DropDown } from '@/components/ui/DropDown';
import { PeakEditGrid } from '@/components/grid';
import type { PeakEditGridRef } from '@/components/grid';
import { Modal } from '@/components/ui/Modal';
import { useCommonCodes } from '@/hooks/useCommonCodes';
import { Upload, Merge, FileSpreadsheet, X, Copy, Download, Trash2, Search } from 'lucide-react';
import * as XLSX from 'xlsx';
import type { FileHeader } from '../../shared/types';

ModuleRegistry.registerModules([AllCommunityModule]);

// =========================================================================
// Types
// =========================================================================

interface CollectionItemRow {
  id: number | null;
  item_id: string;
  node_id: string;
  browse_name: string;
  display_name: string | null;
  korean_name: string | null;
  category: string;
  data_type: string | null;
  unit: string | null;
  sampling_ms: number;
  source_type: string | null;
  aas_property_path: string | null;
  plc_address: string | null;
  vision_csv_column: string | null;
  is_active: boolean;
  aas_linked: boolean;
  aas_path: string | null;
  asset_instance_id: number | null;
  edge_name: string | null;
  equip_name: string | null;
  array_index: number | null;
  memory_area?: string | null;
  register_count?: number | null;
  bit_position?: number | null;
  source_id?: string | null;
}

interface AssetInstanceOption {
  id: number;
  instanceId: string;
  instanceName: string;
  typeCode: string;
}

interface DataSourceOption {
  id: number;
  source_id: string;
  source_name: string;
  source_type: string;
  asset_instance_id: number | null;
  asset_instance_name: string | null;
}

interface CsvImportResult {
  inserted: number;
  updated: number;
  errors: Array<{ row: number; reason: string }>;
  unmatchedEquipNames: string[];
}

type SourceTypeTab = 'PLC' | 'VISION';
type ChannelFilter = 'ALL' | 100 | 1000;

// =========================================================================
// Inline Styles
// =========================================================================

const cardStyle: React.CSSProperties = {
  background: 'var(--color-bg-primary)', border: '1px solid var(--color-border)',
  borderRadius: 8, padding: 16,
};
const tableHeaderStyle: React.CSSProperties = {
  background: 'var(--grid-header-bg, #f0f4f8)', borderBottom: '1px solid var(--color-border)',
  fontSize: 'var(--grid-font-size, 13px)', fontWeight: 600, textAlign: 'left', padding: '8px 10px',
  color: 'var(--color-text-primary)', whiteSpace: 'nowrap',
};
const tableCellStyle: React.CSSProperties = {
  padding: '6px 10px', borderBottom: '1px solid var(--color-border)',
  fontSize: 'var(--grid-font-size, 13px)', color: 'var(--color-text-primary)', whiteSpace: 'nowrap',
};
const tabBtnStyle = (active: boolean): React.CSSProperties => ({
  padding: '8px 16px', borderRadius: 6, fontSize: 13, fontWeight: 500, border: 'none', cursor: 'pointer',
  background: active ? 'var(--color-primary)' : 'var(--color-bg-hover, #e2e8f0)',
  color: active ? '#fff' : 'var(--color-text-secondary)',
  display: 'flex', alignItems: 'center', gap: 6,
});
const filterBtnStyle = (active: boolean): React.CSSProperties => ({
  padding: '4px 10px', borderRadius: 4, fontSize: 12, border: 'none', cursor: 'pointer',
  background: active ? 'var(--color-primary)' : 'var(--color-bg-hover)',
  color: active ? '#fff' : 'var(--color-text-secondary)',
  fontWeight: active ? 600 : 400,
});
const searchInputStyle: React.CSSProperties = {
  padding: '0 8px',
  height: 32,
  border: '1px solid var(--color-border,#d1d5db)',
  borderRadius: 4,
  fontSize: 13,
  color: 'var(--color-text)',
  background: 'var(--color-bg-white,#fff)',
  width: '200px',
};

const CATEGORIES = ['Temperature', 'Time', 'Vision', 'VisionNG', 'Pressure'] as const;

const MENU_CODE = 'AA0031';

// =========================================================================
// Stats Cards Component
// =========================================================================

function StatsCards({ stats, t }: {
  stats: { total: number; active: number; linked: number; unlinked: number };
  t: (key: string, fallback?: string) => string;
}) {
  const items = [
    { label: t('page.aas.dataPoint.statsTotal', '전체'), value: stats.total, color: 'var(--color-text)' },
    { label: t('page.aas.dataPoint.statsActive', '활성'), value: stats.active, color: '#22c55e' },
    { label: t('page.aas.dataPoint.statsLinked', 'AAS연결'), value: stats.linked, color: 'var(--color-primary)' },
    { label: t('page.aas.dataPoint.statsUnlinked', '미연결'), value: stats.unlinked, color: '#eab308' },
  ];
  return (
    <div role="region" aria-label="수집항목 통계" style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '12px', flexShrink: 0 }}>
      {items.map(item => (
        <div key={item.label} style={{ background: 'var(--color-bg-primary)', border: '1px solid var(--color-border)', borderRadius: '8px', padding: '16px', textAlign: 'center' }}>
          <div role="status" style={{ fontSize: 22, fontWeight: 700, color: item.color }}>{item.value}</div>
          <div style={{ fontSize: 12, color: 'var(--color-text-disabled)', marginTop: '4px' }}>{item.label}</div>
        </div>
      ))}
    </div>
  );
}

// =========================================================================
// Utility: isVision check
// =========================================================================

function isVisionItem(item: CollectionItemRow): boolean {
  return item.source_type === 'VISION' || item.category === 'Vision' || item.category === 'VisionNG';
}

// =========================================================================
// Main Page
// =========================================================================

export default function AasDataPointPage() {
  const perm = usePermission(MENU_CODE);
  const { notify } = useToast();
  const { t } = useTranslation();
  const { ConfirmDialog } = useConfirm();

  const memoryCodes = useCommonCodes('MODBUS_MEMORY_AREA');
  const memoryAreas = useMemo(() => memoryCodes['MODBUS_MEMORY_AREA'] ?? [], [memoryCodes]);

  const gridRef = useRef<PeakEditGridRef>(null);
  const csvInputRef = useRef<HTMLInputElement>(null);

  // Tab state
  const [activeTab, setActiveTab] = useState<'merge' | 'items'>('items');

  // Source type tab (PLC / Vision)
  const [sourceTypeTab, setSourceTypeTab] = useState<SourceTypeTab>('PLC');

  // Instance dropdown
  const [instances, setInstances] = useState<AssetInstanceOption[]>([]);
  const [selectedInstanceId, setSelectedInstanceId] = useState<number | null>(null);

  // Grid data
  const [items, setItems] = useState<CollectionItemRow[]>([]);
  const [loading, setLoading] = useState(true);

  // Upload state
  const [uploading, setUploading] = useState(false);

  // Category filter
  const [categoryFilter, setCategoryFilter] = useState<string>('all');

  // DataSource dropdown (server-side filter)
  const [selectedSourceId, setSelectedSourceId] = useState<string>('');
  const [dataSources, setDataSources] = useState<DataSourceOption[]>([]);

  // Channel filter
  const [channelFilter, setChannelFilter] = useState<ChannelFilter>('ALL');

  // Text search
  const [searchText, setSearchText] = useState('');

  // Merge tab state
  const [mergeFiles, setMergeFiles] = useState<FileHeader[]>([]);
  const [mergedHeaders, setMergedHeaders] = useState<string[]>([]);
  const [copied, setCopied] = useState(false);
  const mergeFileInputRef = useRef<HTMLInputElement>(null);

  // CSV import result modal
  const [importResult, setImportResult] = useState<CsvImportResult | null>(null);

  // -----------------------------------------------------------------------
  // Data Loading
  // -----------------------------------------------------------------------

  const loadInstances = useCallback(async () => {
    try {
      const res = await authFetch('/api/aas/instances');
      if (res.ok) {
        const json = await res.json();
        const data: AssetInstanceOption[] = (json.data ?? json).map((inst: Record<string, unknown>) => ({
          id: inst.seq_id ?? inst.id,
          instanceId: inst.instance_id,
          instanceName: inst.instance_name,
          typeCode: inst.type_code,
        }));
        setInstances(data);
      }
    } catch {
      notify(t('message.loadFailed', 'Asset Instance 목록 로드 실패'), { type: 'error' });
    }
  }, [notify, t]);

  const loadDataSources = useCallback(async (instanceId: number | null) => {
    if (instanceId == null) {
      setDataSources([]);
      setSelectedSourceId('');
      return;
    }
    try {
      const res = await authFetch(`/api/opcua/data-sources?instanceId=${instanceId}`);
      if (res.ok) {
        const data: DataSourceOption[] = await res.json();
        setDataSources(data);
      }
    } catch {
      // DataSource 로드 실패 시 빈 배열 유지
    }
  }, []);

  const loadItems = useCallback(async (instanceId: number | null, sourceId?: string) => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (instanceId != null) params.set('instanceId', String(instanceId));
      if (sourceId) params.set('sourceId', sourceId);
      const qs = params.toString();
      const url = qs ? `/api/opcua/collection-items?${qs}` : '/api/opcua/collection-items';
      const res = await authFetch(url);
      if (res.ok) {
        const data: CollectionItemRow[] = await res.json();
        setItems(data);
      } else {
        notify(t('message.loadFailed', '수집항목 로드 실패'), { type: 'error' });
      }
    } catch {
      notify(t('message.loadFailed', '수집항목 로드 실패'), { type: 'error' });
    } finally {
      setLoading(false);
    }
  }, [notify, t]);

  useEffect(() => {
    loadInstances();
  }, [loadInstances]);

  useEffect(() => {
    loadDataSources(selectedInstanceId);
    loadItems(selectedInstanceId);
  }, [selectedInstanceId, loadDataSources, loadItems]);

  // sourceId 변경 시 수집항목 재조회
  useEffect(() => {
    if (selectedSourceId) {
      loadItems(selectedInstanceId, selectedSourceId);
    } else if (selectedInstanceId != null) {
      loadItems(selectedInstanceId);
    }
    // selectedSourceId 변경 시에만 재조회 (selectedInstanceId 변경은 위 effect에서 처리)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedSourceId]);

  // -----------------------------------------------------------------------
  // Instance Dropdown Handler
  // -----------------------------------------------------------------------

  const handleInstanceChange = useCallback((e: React.ChangeEvent<HTMLSelectElement>) => {
    const val = e.target.value;
    setSelectedInstanceId(val === '' ? null : Number(val));
    setCategoryFilter('all');
    setSelectedSourceId('');
    setChannelFilter('ALL');
    setSearchText('');
  }, []);

  // -----------------------------------------------------------------------
  // Source Type Tab change — reset sub-filters
  // -----------------------------------------------------------------------

  const handleSourceTypeTabChange = useCallback((tab: SourceTypeTab) => {
    setSourceTypeTab(tab);
    setSelectedSourceId('');
    setCategoryFilter('all');
    setChannelFilter('ALL');
    setSearchText('');
  }, []);

  // -----------------------------------------------------------------------
  // tabFilteredItems — sourceTypeTab only (for stats)
  // -----------------------------------------------------------------------

  const tabFilteredItems = useMemo(() => {
    return items.filter(item => {
      const vision = isVisionItem(item);
      return sourceTypeTab === 'VISION' ? vision : !vision;
    });
  }, [items, sourceTypeTab]);

  // -----------------------------------------------------------------------
  // Stats (based on tabFilteredItems — sourceTypeTab only)
  // -----------------------------------------------------------------------

  const stats = useMemo(() => {
    const total = tabFilteredItems.length;
    const active = tabFilteredItems.filter(i => i.is_active).length;
    const linked = tabFilteredItems.filter(i => i.aas_linked).length;
    return { total, active, linked, unlinked: total - linked };
  }, [tabFilteredItems]);

  // -----------------------------------------------------------------------
  // filteredItems — full filter chain (sourceId filtering is server-side)
  // -----------------------------------------------------------------------

  const filteredItems = useMemo(() => {
    let result = tabFilteredItems;

    // Category filter
    if (categoryFilter !== 'all') {
      result = result.filter(item => item.category === categoryFilter);
    }

    // Channel filter (sampling_ms)
    if (channelFilter !== 'ALL') {
      result = result.filter(item => item.sampling_ms === channelFilter);
    }

    // Text search
    if (searchText.trim()) {
      const q = searchText.toLowerCase();
      result = result.filter(item =>
        (item.browse_name ?? '').toLowerCase().includes(q) ||
        (item.korean_name ?? '').toLowerCase().includes(q) ||
        (item.plc_address ?? '').toLowerCase().includes(q) ||
        (item.node_id ?? '').toLowerCase().includes(q) ||
        (item.equip_name ?? '').toLowerCase().includes(q)
      );
    }

    return result;
  }, [tabFilteredItems, categoryFilter, channelFilter, searchText]);

  // -----------------------------------------------------------------------
  // PLC Tab Columns (17)
  // -----------------------------------------------------------------------

  const plcColumns = useMemo<ColDef<CollectionItemRow>[]>(() => [
    // Group 0: Source
    {
      headerName: t('page.aas.collection.sourceId', '소스'), field: 'source_id', width: 130,
      editable: () => selectedInstanceId != null,
      cellEditor: 'agSelectCellEditor',
      cellEditorParams: { values: ['', ...dataSources.map(ds => ds.source_id)] },
      valueFormatter: (p) => {
        if (!p.value) return '';
        const ds = dataSources.find(d => d.source_id === p.value);
        return ds ? `${ds.source_name}` : String(p.value);
      },
    },
    // Group 1: Location
    { headerName: t('page.aas.collection.equipName', 'EquipmentName'), field: 'equip_name', width: 140, editable: true },
    { headerName: t('page.aas.collection.edgeName', 'EdgeName'), field: 'edge_name', width: 100, editable: true },
    // Group 2: Identity & Classification
    { headerName: 'Node ID', field: 'node_id', width: 220, editable: (p) => !p.data?.id, cellClass: 'ag-left-aligned-cell' },
    { headerName: t('page.aas.dataPoint.browseName', '수집 변수명'), field: 'browse_name', width: 160, editable: true },
    { headerName: t('page.aas.dataPoint.koreanName', '한글명'), field: 'korean_name', width: 140, editable: true },
    {
      headerName: t('page.aas.collection.category', '수집유형'), field: 'category', width: 110, editable: true,
      cellEditor: 'agSelectCellEditor',
      cellEditorParams: { values: [...CATEGORIES] },
    },
    // Group 3: Device Address
    { headerName: t('page.aas.dataPoint.plcAddress', 'PLC 메모리주소'), field: 'plc_address', width: 120, editable: true },
    {
      headerName: t('page.aas.collection.memoryArea', '메모리 영역'), field: 'memory_area', width: 150, editable: true,
      cellEditor: 'agSelectCellEditor',
      cellEditorParams: {
        values: memoryAreas.length > 0
          ? ['', ...memoryAreas.map(c => c.code)]
          : ['', 'FC01_COIL', 'FC02_DISCRETE', 'FC03_INPUT_REG', 'FC04_HOLDING_REG'],
      },
      valueFormatter: (p) => {
        if (!p.value) return '';
        const found = memoryAreas.find(c => c.code === p.value);
        return found ? found.codeName : (p.value ?? '');
      },
    },
    { headerName: t('page.aas.collection.registerCount', '레지스터 수'), field: 'register_count', width: 90, editable: true, cellDataType: 'number' },
    { headerName: t('page.aas.collection.bitPosition', '비트 위치'), field: 'bit_position', width: 80, editable: true, cellDataType: 'number' },
    { headerName: t('page.aas.collection.arrayIndex', 'ArrayIndex'), field: 'array_index', width: 80, editable: true, cellDataType: 'number' },
    // Group 4: Data Attributes
    { headerName: t('page.aas.dataPoint.dataType', '데이터타입'), field: 'data_type', width: 100, editable: true },
    { headerName: t('page.aas.dataPoint.unit', '단위'), field: 'unit', width: 70, editable: true },
    { headerName: t('page.aas.collection.samplingMs', '수집주기(ms)'), field: 'sampling_ms', width: 100, editable: true, cellDataType: 'number' },
    // Group 5: AAS Link
    { headerName: t('page.aas.collection.aasPropertyPath', 'AAS 속성경로'), field: 'aas_property_path', width: 220, editable: false, cellClass: 'ag-left-aligned-cell' },
    {
      headerName: t('page.aas.dataPoint.aasLinked', 'AAS 연결'), field: 'aas_linked', width: 70, editable: false,
      cellRenderer: (p: ICellRendererParams) => (
        <span style={{ color: p.value ? '#22c55e' : '#eab308', fontWeight: 600 }}>{p.value ? 'O' : '-'}</span>
      ),
    },
    // Group 6: Operations
    {
      headerName: t('page.aas.collection.isActive', '사용여부'), field: 'is_active', width: 80, editable: true,
      cellEditor: 'agSelectCellEditor',
      cellEditorParams: { values: ['ON', 'OFF'] },
      valueGetter: (p: { data?: CollectionItemRow }) => p.data?.is_active ? 'ON' : 'OFF',
      valueSetter: (p: { data: CollectionItemRow; newValue: string }) => {
        p.data.is_active = p.newValue === 'ON';
        return true;
      },
      cellRenderer: (p: ICellRendererParams) => <span>{p.value}</span>,
    },
  ], [t, memoryAreas, dataSources, selectedInstanceId]);

  // -----------------------------------------------------------------------
  // Vision Tab Columns — Group 3 replaced with vision_csv_column
  // -----------------------------------------------------------------------

  const visionColumns = useMemo<ColDef<CollectionItemRow>[]>(() => [
    // Group 0: Source
    {
      headerName: t('page.aas.collection.sourceId', '소스'), field: 'source_id', width: 130,
      editable: () => selectedInstanceId != null,
      cellEditor: 'agSelectCellEditor',
      cellEditorParams: { values: ['', ...dataSources.map(ds => ds.source_id)] },
      valueFormatter: (p) => {
        if (!p.value) return '';
        const ds = dataSources.find(d => d.source_id === p.value);
        return ds ? `${ds.source_name}` : String(p.value);
      },
    },
    // Group 1: Location
    { headerName: t('page.aas.collection.equipName', 'EquipmentName'), field: 'equip_name', width: 140, editable: true },
    { headerName: t('page.aas.collection.edgeName', 'EdgeName'), field: 'edge_name', width: 100, editable: true },
    // Group 2: Identity & Classification
    { headerName: 'Node ID', field: 'node_id', width: 220, editable: (p) => !p.data?.id, cellClass: 'ag-left-aligned-cell' },
    { headerName: t('page.aas.dataPoint.browseName', '수집 변수명'), field: 'browse_name', width: 160, editable: true },
    { headerName: t('page.aas.dataPoint.koreanName', '한글명'), field: 'korean_name', width: 140, editable: true },
    {
      headerName: t('page.aas.collection.category', '수집유형'), field: 'category', width: 110, editable: true,
      cellEditor: 'agSelectCellEditor',
      cellEditorParams: { values: [...CATEGORIES] },
    },
    // Group 3 (Vision): single column instead of PLC 5
    { headerName: t('page.aas.dataPoint.visionCsvColumn', '비전CSV컬럼명'), field: 'vision_csv_column', width: 150, editable: true },
    // Group 4: Data Attributes
    { headerName: t('page.aas.dataPoint.dataType', '데이터타입'), field: 'data_type', width: 100, editable: true },
    { headerName: t('page.aas.dataPoint.unit', '단위'), field: 'unit', width: 70, editable: true },
    { headerName: t('page.aas.collection.samplingMs', '수집주기(ms)'), field: 'sampling_ms', width: 100, editable: true, cellDataType: 'number' },
    // Group 5: AAS Link
    { headerName: t('page.aas.collection.aasPropertyPath', 'AAS 속성경로'), field: 'aas_property_path', width: 220, editable: false, cellClass: 'ag-left-aligned-cell' },
    {
      headerName: t('page.aas.dataPoint.aasLinked', 'AAS 연결'), field: 'aas_linked', width: 70, editable: false,
      cellRenderer: (p: ICellRendererParams) => (
        <span style={{ color: p.value ? '#22c55e' : '#eab308', fontWeight: 600 }}>{p.value ? 'O' : '-'}</span>
      ),
    },
    // Group 6: Operations
    {
      headerName: t('page.aas.collection.isActive', '사용여부'), field: 'is_active', width: 80, editable: true,
      cellEditor: 'agSelectCellEditor',
      cellEditorParams: { values: ['ON', 'OFF'] },
      valueGetter: (p: { data?: CollectionItemRow }) => p.data?.is_active ? 'ON' : 'OFF',
      valueSetter: (p: { data: CollectionItemRow; newValue: string }) => {
        p.data.is_active = p.newValue === 'ON';
        return true;
      },
      cellRenderer: (p: ICellRendererParams) => <span>{p.value}</span>,
    },
  ], [t, dataSources, selectedInstanceId]);

  // Select columns based on sourceTypeTab
  const columns = sourceTypeTab === 'VISION' ? visionColumns : plcColumns;

  // -----------------------------------------------------------------------
  // Batch Save
  // -----------------------------------------------------------------------

  const isAllMode = selectedInstanceId === null;

  const handleBatchSave = useCallback(async (
    rows: { _rowState: string; [key: string]: unknown }[]
  ): Promise<void> => {
    if (isAllMode) {
      notify(t('page.aas.collection.saveForbiddenInAll', '전체 보기 모드에서는 저장할 수 없습니다.'), { type: 'error' });
      return;
    }

    const created = rows.filter(r => r._rowState === 'created') as unknown as CollectionItemRow[];
    const updated = rows.filter(r => r._rowState === 'updated') as unknown as CollectionItemRow[];
    const deleted = rows.filter(r => r._rowState === 'deleted') as unknown as CollectionItemRow[];
    let success = true;

    // Delete
    for (const item of deleted) {
      if (!item.node_id) continue;
      try {
        const res = await authFetch(`/api/opcua/collection-items/${encodeURIComponent(item.node_id)}`, { method: 'DELETE' });
        if (!res.ok) {
          const err = await res.json().catch(() => ({ detail: '삭제 실패' }));
          notify(err.detail || '삭제 실패', { type: 'error' });
          success = false;
        }
      } catch {
        notify('삭제 실패', { type: 'error' });
        success = false;
      }
    }

    // Create
    for (const item of created) {
      if (!item.node_id || !item.browse_name) continue;
      try {
        const res = await authFetch('/api/opcua/collection-items', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            node_id: item.node_id,
            browse_name: item.browse_name || item.node_id,
            display_name: item.display_name,
            category: item.category || 'Temperature',
            data_type: item.data_type,
            unit: item.unit,
            sampling_ms: item.sampling_ms || 1000,
            source_type: item.source_type || 'OPC_UA',
            plc_address: item.plc_address,
            aas_property_path: item.aas_property_path,
            vision_csv_column: item.vision_csv_column,
            is_active: item.is_active !== false,
            memory_area: item.memory_area ?? null,
            register_count: item.register_count ?? null,
            bit_position: item.bit_position ?? null,
            source_id: item.source_id ?? null,
            asset_instance_id: selectedInstanceId,
          }),
        });
        if (!res.ok) {
          const err = await res.json().catch(() => ({ detail: '생성 실패' }));
          notify(err.detail || '생성 실패', { type: 'error' });
          success = false;
        }
      } catch {
        notify('생성 실패', { type: 'error' });
        success = false;
      }
    }

    // Update
    for (const item of updated) {
      if (!item.node_id) continue;
      try {
        const res = await authFetch(`/api/opcua/collection-items/${encodeURIComponent(item.node_id)}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            node_id: item.node_id,
            browse_name: item.browse_name || item.node_id,
            display_name: item.display_name,
            category: item.category,
            data_type: item.data_type,
            unit: item.unit,
            sampling_ms: item.sampling_ms,
            source_type: item.source_type,
            plc_address: item.plc_address,
            aas_property_path: item.aas_property_path,
            vision_csv_column: item.vision_csv_column,
            is_active: item.is_active,
            memory_area: item.memory_area ?? null,
            register_count: item.register_count ?? null,
            bit_position: item.bit_position ?? null,
            source_id: item.source_id ?? null,
            asset_instance_id: selectedInstanceId,
          }),
        });
        if (!res.ok) {
          const err = await res.json().catch(() => ({ detail: '수정 실패' }));
          notify(err.detail || '수정 실패', { type: 'error' });
          success = false;
        }
      } catch {
        notify('수정 실패', { type: 'error' });
        success = false;
      }
    }

    if (success) {
      notify(t('common.saveSuccess', '저장되었습니다.'), { type: 'success' });
      await loadItems(selectedInstanceId, selectedSourceId || undefined);
    }
  }, [isAllMode, selectedInstanceId, selectedSourceId, notify, t, loadItems]);

  // -----------------------------------------------------------------------
  // CSV Import
  // -----------------------------------------------------------------------

  const handleCsvImport = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (isAllMode) {
      notify(t('page.aas.collection.saveForbiddenInAll', '전체 보기 모드에서는 CSV 업로드가 불가합니다. 인스턴스를 선택하세요.'), { type: 'error' });
      if (csvInputRef.current) csvInputRef.current.value = '';
      return;
    }

    const fd = new FormData();
    fd.append('file', file);

    setUploading(true);
    try {
      const url = selectedInstanceId != null
        ? `/api/opcua/collection-items/import-csv?instanceId=${selectedInstanceId}`
        : '/api/opcua/collection-items/import-csv';
      const res = await authFetch(url, { method: 'POST', body: fd });

      if (res.ok) {
        const result: CsvImportResult = await res.json();
        setImportResult(result);
        notify(
          t('page.aas.collection.importResult', '임포트 결과: 신규 {{inserted}}건 / 갱신 {{updated}}건', {
            inserted: result.inserted,
            updated: result.updated,
          }),
          { type: 'success' }
        );
        if (result.errors.length > 0) {
          notify(
            t('page.aas.collection.importErrors', '처리 실패: {{count}}건', { count: result.errors.length }),
            { type: 'error' }
          );
        }
        await loadItems(selectedInstanceId, selectedSourceId || undefined);
      } else {
        const err = await res.json().catch(() => ({ detail: 'CSV 가져오기 실패' }));
        notify(err.detail || 'CSV 가져오기 실패', { type: 'error' });
      }
    } catch {
      notify('CSV 가져오기 실패', { type: 'error' });
    } finally {
      setUploading(false);
      if (csvInputRef.current) csvInputRef.current.value = '';
    }
  }, [isAllMode, selectedInstanceId, selectedSourceId, notify, t, loadItems]);

  // -----------------------------------------------------------------------
  // Template Download (moved to merge tab cards)
  // -----------------------------------------------------------------------


  // -----------------------------------------------------------------------
  // Extra Toolbar Buttons (items tab) — CSV upload only
  // -----------------------------------------------------------------------

  const extraToolbarButtons = useMemo(() => {
    if (!perm.canCreate) return undefined;
    return (
      <>
        <input ref={csvInputRef} type="file" accept=".csv" onChange={handleCsvImport} style={{ display: 'none' }} />
        <button
          className="mes-btn"
          disabled={uploading}
          onClick={() => {
            if (isAllMode) {
              notify(t('page.aas.collection.saveForbiddenInAll'), { type: 'error' });
              return;
            }
            csvInputRef.current?.click();
          }}
        >
          <Upload className="w-4 h-4" />
          {uploading
            ? t('page.aas.collection.csvUploading', '업로드 중...')
            : t('page.aas.collection.csvUpload', 'CSV 업로드')}
        </button>
      </>
    );
  }, [perm.canCreate, handleCsvImport, isAllMode, notify, t, uploading]);

  // -----------------------------------------------------------------------
  // Merge Tab Handlers
  // -----------------------------------------------------------------------

  const extractHeaders = useCallback((file: File): Promise<string[]> => new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (ev) => {
      try {
        const wb = XLSX.read(ev.target?.result, { type: 'array' });
        const d = XLSX.utils.sheet_to_json(wb.Sheets[wb.SheetNames[0]], { header: 1 }) as string[][];
        resolve((d[0] || []).map(h => String(h || '').trim()).filter(h => h !== ''));
      } catch (err) { reject(err); }
    };
    reader.onerror = () => reject(new Error('파일 읽기 실패'));
    reader.readAsArrayBuffer(file);
  }), []);

  const handleMergeFileUpload = useCallback(async (ev: React.ChangeEvent<HTMLInputElement>) => {
    const files = ev.target.files;
    if (!files) return;
    const newFiles: FileHeader[] = [];
    for (const f of Array.from(files)) {
      try { newFiles.push({ fileName: f.name, headers: await extractHeaders(f) }); }
      catch { /* 파일 파싱 실패 -- 해당 파일 건너뜀 */ }
    }
    setMergeFiles(prev => [...prev, ...newFiles]);
    if (mergeFileInputRef.current) mergeFileInputRef.current.value = '';
  }, [extractHeaders]);

  const doMergeHeaders = useCallback(() => {
    setMergedHeaders([...new Set(mergeFiles.flatMap(f => f.headers))]);
  }, [mergeFiles]);

  const copyMergedHeaders = useCallback(() => {
    navigator.clipboard.writeText(mergedHeaders.join('\t'));
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }, [mergedHeaders]);

  const downloadMergedCSV = useCallback(() => {
    const blob = new Blob(['﻿' + mergedHeaders.join(',')], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'merged_headers.csv';
    link.click();
    URL.revokeObjectURL(url);
  }, [mergedHeaders]);

  const maxMergeColumns = Math.max(...mergeFiles.map(f => f.headers.length), 0);

  // -----------------------------------------------------------------------
  // gridId based on sourceTypeTab
  // -----------------------------------------------------------------------

  const gridId = sourceTypeTab === 'VISION' ? 'aa0031-data-points-vision-v2' : 'aa0031-data-points-v2';

  // -----------------------------------------------------------------------
  // Render
  // -----------------------------------------------------------------------

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      {/* --- Single-row header: Title + Tabs + Filters --- */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '8px 16px', flexWrap: 'wrap', flexShrink: 0 }}>
        <PageTitle menuCode={MENU_CODE} />

        {/* divider */}
        <div style={{ width: 1, height: 20, background: 'var(--color-border)', flexShrink: 0 }} />

        {/* Tab buttons */}
        <button style={tabBtnStyle(activeTab === 'items')} onClick={() => setActiveTab('items')}>
          {t('page.aas.collection.collectionItems', '수집 항목')}
        </button>
        <button style={tabBtnStyle(activeTab === 'merge')} onClick={() => setActiveTab('merge')}>
          <Merge className="w-4 h-4" /> {t('page.aas.collection.headerMerge', 'CSV 병합')}
        </button>

        {/* Merge-tab usage hint */}
        {activeTab === 'merge' && (
          <span style={{ fontSize: 12, color: 'var(--color-text-disabled)' }}>
            {t('page.aas.collection.mergeHint', '여러 엑셀/CSV 파일의 헤더를 중복 없이 하나로 합칩니다.')}
          </span>
        )}

        {/* Items-tab only controls */}
        {activeTab === 'items' && (
          <>
            {/* PLC / Vision tab */}
            <div style={{ width: 1, height: 20, background: 'var(--color-border)', flexShrink: 0 }} />
            <button style={filterBtnStyle(sourceTypeTab === 'PLC')} onClick={() => handleSourceTypeTabChange('PLC')}>
              {t('page.aas.dataPoint.tabPlc', 'PLC')}
            </button>
            <button style={filterBtnStyle(sourceTypeTab === 'VISION')} onClick={() => handleSourceTypeTabChange('VISION')}>
              {t('page.aas.dataPoint.tabVision', 'Vision')}
            </button>

            {/* divider */}
            <div style={{ width: 1, height: 20, background: 'var(--color-border)', flexShrink: 0 }} />

            {/* Asset Instance dropdown */}
            <DropDown
              options={[
                { value: '', label: t('page.aas.collection.allInstances', '전체 보기(미배정 포함)') },
                ...instances.map(inst => ({ value: String(inst.id), label: `${inst.instanceName} (${inst.instanceId})` })),
              ]}
              value={selectedInstanceId != null ? String(selectedInstanceId) : ''}
              onChange={e => handleInstanceChange({ target: { value: String(e.target.value) } } as React.ChangeEvent<HTMLSelectElement>)}
              btnWidth={220}
              heightType="h32"
            />

            {/* DataSource filter */}
            <DropDown
              options={[
                { value: '', label: t('page.aas.collection.allSources', '전체 소스') },
                ...dataSources.map(ds => ({
                  value: ds.source_id,
                  label: `${ds.source_name} (${ds.source_id})`,
                })),
              ]}
              value={selectedSourceId}
              onChange={e => setSelectedSourceId(String(e.target.value))}
              disabled={selectedInstanceId == null}
              btnWidth={200}
              heightType="h32"
            />

            {/* Channel filter buttons */}
            <button style={filterBtnStyle(channelFilter === 'ALL')} onClick={() => setChannelFilter('ALL')}>
              {t('common.all', '전체')}
            </button>
            <button style={filterBtnStyle(channelFilter === 100)} onClick={() => setChannelFilter(100)}>
              {t('page.aas.dataPoint.channel100ms', '100ms')}
            </button>
            <button style={filterBtnStyle(channelFilter === 1000)} onClick={() => setChannelFilter(1000)}>
              {t('page.aas.dataPoint.channel1s', '1s')}
            </button>

            {/* Text search */}
            <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
              <Search className="w-4 h-4" style={{ position: 'absolute', left: 8, color: 'var(--color-text-disabled)' }} />
              <input
                aria-label={t('page.aas.dataPoint.searchPlaceholder', '변수명, 한글명, PLC 메모리주소, Node ID...')}
                value={searchText}
                onChange={e => setSearchText(e.target.value)}
                placeholder={t('page.aas.dataPoint.searchPlaceholder', '변수명, 한글명, PLC 메모리주소, Node ID...')}
                style={{ ...searchInputStyle, paddingLeft: 28 }}
              />
            </div>

            <span style={{ fontSize: 13, color: 'var(--color-text-disabled)', marginLeft: 'auto' }}>
              {filteredItems.length}{t('common.count', '건')}
            </span>
          </>
        )}
      </div>

      <div style={{ padding: '0 16px 12px', flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
        <div style={{ flex: 1, overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
          {/* --- Items Tab --- */}
          {activeTab === 'items' && (
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden', minHeight: 0, gap: 12 }}>
              {/* Stats Cards */}
              <StatsCards stats={stats} t={t} />

              {/* PeakEditGrid */}
              <PeakEditGrid
                ref={gridRef}
                gridId={gridId}
                data={filteredItems}
                columns={columns}
                permission={perm}
                hideRowButtons={false}
                extraToolbarButtons={extraToolbarButtons}
                onBatchSave={handleBatchSave}
                bodyHeight="fitToParent"
                loading={loading}
              />
            </div>
          )}

          {/* --- Merge Tab --- */}
          {activeTab === 'merge' && (
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 12, overflow: 'hidden' }}>
              {/* File Upload Area */}
              <div style={cardStyle}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                  <h3 style={{ fontWeight: 700 }}>{t('page.aas.collection.fileUploadTitle', '파일 업로드')}</h3>
                  <div style={{ display: 'flex', gap: 6 }}>
                    <input ref={mergeFileInputRef} type="file" accept=".xlsx,.xls,.csv" multiple onChange={handleMergeFileUpload} style={{ display: 'none' }} />
                    <button className="mes-btn mes-btn-search" onClick={() => mergeFileInputRef.current?.click()}>
                      <Upload className="w-4 h-4" /> {t('page.aas.collection.fileSelect', '파일 선택')}
                    </button>
                    <button className="mes-btn mes-btn-delete" onClick={() => { setMergeFiles([]); setMergedHeaders([]); }} disabled={mergeFiles.length === 0}>
                      <Trash2 className="w-4 h-4" /> {t('common.deleteAll', '전체 삭제')}
                    </button>
                  </div>
                </div>
                {mergeFiles.length > 0 ? (
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                    {mergeFiles.map((file, idx) => (
                      <div key={idx} style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '4px 10px', background: 'var(--color-bg-hover)', borderRadius: 6, fontSize: 13 }}>
                        <FileSpreadsheet className="w-4 h-4" style={{ color: '#22c55e' }} /><span>{file.fileName}</span>
                        <span style={{ color: 'var(--color-text-disabled)' }}>({file.headers.length}{t('page.aas.collection.columns', '열')})</span>
                        <button onClick={() => setMergeFiles(prev => prev.filter((_, i) => i !== idx))} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}>
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div style={{ textAlign: 'center', color: 'var(--color-text-disabled)', padding: 16 }}>
                    {t('page.aas.collection.mergeFileHint', '엑셀(.xlsx, .xls) 또는 CSV 파일을 업로드하세요.')}
                  </div>
                )}
              </div>

              {mergeFiles.length > 0 && (
                <div style={{ ...cardStyle, flex: 1, overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
                    <h3 style={{ fontWeight: 700 }}>
                      {t('page.aas.collection.headerCompare', '헤더 비교')} ({mergeFiles.length}{t('page.aas.collection.fileCount', '개 파일')})
                    </h3>
                    <button className="mes-btn mes-btn-save" onClick={doMergeHeaders}>
                      <Merge className="w-4 h-4" /> {t('page.aas.collection.mergeAction', '중복 제거 및 병합')}
                    </button>
                  </div>
                  <div style={{ flex: 1, overflow: 'auto' }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                      <thead>
                        <tr>
                          <th style={{ ...tableHeaderStyle, position: 'sticky', left: 0, zIndex: 10, minWidth: 150 }}>
                            {t('page.aas.collection.fileName', '파일명')}
                          </th>
                          {Array.from({ length: maxMergeColumns }, (_, i) => (
                            <th key={i} style={{ ...tableHeaderStyle, textAlign: 'center', minWidth: 120 }}>
                              {t('page.aas.collection.columnN', '구분')}{i + 1}
                            </th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {mergeFiles.map((file, rowIdx) => (
                          <tr key={rowIdx}>
                            <td style={{ ...tableCellStyle, position: 'sticky', left: 0, zIndex: 10, background: 'var(--color-bg-primary)', fontWeight: 500 }}>
                              {file.fileName}
                            </td>
                            {Array.from({ length: maxMergeColumns }, (_, colIdx) => (
                              <td key={colIdx} style={{ ...tableCellStyle, textAlign: 'center' }}>
                                {file.headers[colIdx] || <span style={{ color: 'var(--color-text-disabled)' }}>-</span>}
                              </td>
                            ))}
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {mergedHeaders.length > 0 && (
                <div style={{ ...cardStyle, border: '1px solid #86efac' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
                    <h3 style={{ fontWeight: 700, color: '#16a34a' }}>
                      {t('page.aas.collection.mergeResult', '병합 결과')} ({mergeFiles.flatMap(f => f.headers).length} -&gt; {mergedHeaders.length}{t('page.aas.collection.mergeResultUnit', '개')})
                    </h3>
                    <div style={{ display: 'flex', gap: 6 }}>
                      <button className="mes-btn" onClick={copyMergedHeaders}>
                        <Copy className="w-4 h-4" /> {copied ? t('page.aas.collection.copied', '복사됨!') : t('page.aas.collection.clipboardCopy', '클립보드 복사')}
                      </button>
                      <button className="mes-btn" onClick={downloadMergedCSV}>
                        <Download className="w-4 h-4" /> {t('page.aas.collection.csvDownload', 'CSV 다운로드')}
                      </button>
                    </div>
                  </div>
                  <div style={{ overflow: 'auto' }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                      <thead>
                        <tr>{mergedHeaders.map((_, i) => <th key={i} style={{ ...tableHeaderStyle, textAlign: 'center', minWidth: 120, background: '#dcfce7' }}>{t('page.aas.collection.columnN', '구분')}{i + 1}</th>)}</tr>
                      </thead>
                      <tbody>
                        <tr>{mergedHeaders.map((h, i) => <td key={i} style={{ ...tableCellStyle, textAlign: 'center', background: '#f0fdf4' }}>{h}</td>)}</tr>
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* CSV Import Result Modal */}
      {importResult && importResult.errors.length > 0 && (
        <Modal
          open={true}
          onClose={() => setImportResult(null)}
          title={t('page.aas.collection.csvImportTitle', 'CSV 가져오기 결과')}
          width={600}
        >
          <div style={{ marginBottom: 12 }}>
            <p style={{ fontSize: 13, marginBottom: 8 }}>
              {t('page.aas.collection.importResult', '임포트 결과: 신규 {{inserted}}건 / 갱신 {{updated}}건', {
                inserted: importResult.inserted,
                updated: importResult.updated,
              })}
            </p>
            {importResult.unmatchedEquipNames.length > 0 && (
              <div style={{ marginBottom: 8, padding: 8, background: '#fef3c7', borderRadius: 4, fontSize: 12 }}>
                <strong>{t('page.aas.collection.unmatchedEquipNames', '매칭 실패 설비명')}:</strong>{' '}
                {importResult.unmatchedEquipNames.join(', ')}
              </div>
            )}
          </div>
          <div style={{ maxHeight: 300, overflow: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr>
                  <th style={{ ...tableHeaderStyle, width: 60 }}>{t('page.aas.collection.row', '행')}</th>
                  <th style={tableHeaderStyle}>{t('page.aas.collection.reason', '사유')}</th>
                </tr>
              </thead>
              <tbody>
                {importResult.errors.map((err, idx) => (
                  <tr key={idx}>
                    <td style={{ ...tableCellStyle, textAlign: 'center' }}>{err.row}</td>
                    <td style={tableCellStyle}>{err.reason}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 12 }}>
            <button className="mes-btn" onClick={() => setImportResult(null)}>
              {t('common.close', '닫기')}
            </button>
          </div>
        </Modal>
      )}

      <ConfirmDialog />
    </div>
  );
}
