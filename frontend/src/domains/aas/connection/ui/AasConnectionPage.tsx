import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { AllCommunityModule, ModuleRegistry, type ColDef } from 'ag-grid-community';
import { authFetch } from '@/lib/api';
import { usePermission } from '@/hooks/usePermission';
import { useTranslation } from 'react-i18next';
import { useToast } from '@/shared/components/toast/ToastProvider';
import { PageTitle } from '@/components/ui/PageTitle';
import { PeakEditGrid } from '@/components/grid';
import type { PeakEditGridRef } from '@/components/grid';
import { useCommonCodes } from '@/hooks/useCommonCodes';
import PlcConnectionHelpModal from '../components/PlcConnectionHelpModal';

ModuleRegistry.registerModules([AllCommunityModule]);

interface AssetInstanceOption {
  id: number;
  instance_id: string;
  instance_name: string;
}

interface DataSourceRow {
  id?: number;
  source_id: string;
  source_name: string;
  asset_instance_code?: string | null;
  asset_instance_name?: string | null;
  asset_instance_id?: number | null;
  source_type: string;
  plc_protocol?: string;
  plc_ip?: string;
  plc_port?: number;
  unit_id?: number | null;
  address_base?: number | null;
  byte_order?: string | null;
  word_order?: string | null;
  vision_watch_folder?: string;
  vision_csv_pattern?: string;
  status: string;
  use_yn: string;
}

function TestConnectionRenderer({
  data,
  notify,
}: {
  data: DataSourceRow;
  notify: (msg: string, opts: { type: string }) => void;
}) {
  const [loading, setLoading] = useState(false);

  const handleTest = async () => {
    if (!data.source_id) return;
    setLoading(true);
    try {
      const res = await authFetch(
        `/api/opcua/data-sources/${encodeURIComponent(data.source_id)}/test-connection`,
        { method: 'POST' }
      );
      const result = await res.json();
      if (result.success) {
        notify(`연결 성공 (${result.latency_ms}ms)`, { type: 'success' });
      } else {
        notify(`연결 실패: ${result.message}`, { type: 'error' });
      }
    } catch {
      notify('연결 테스트 실패', { type: 'error' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <button
      className="mes-btn"
      onClick={handleTest}
      disabled={loading || !data.source_id}
    >
      {loading ? '테스트 중...' : '테스트'}
    </button>
  );
}

export default function AasConnectionPage() {
  const { t } = useTranslation();
  const { notify } = useToast();
  const perm = usePermission('AA0040');
  const gridRef = useRef<PeakEditGridRef>(null);
  const [sources, setSources] = useState<DataSourceRow[]>([]);
  const [typeFilter, setTypeFilter] = useState<string>('PLC');
  const [loading, setLoading] = useState(false);
  const [instanceOptions, setInstanceOptions] = useState<AssetInstanceOption[]>([]);

  const [helpOpen, setHelpOpen] = useState(false);

  const codes = useCommonCodes('AAS_SOURCE_TYPE', 'AAS_PROTOCOL', 'MODBUS_BYTE_ORDER', 'MODBUS_WORD_ORDER');
  const sourceTypes = useMemo(() => codes['AAS_SOURCE_TYPE'] ?? [], [codes]);
  const protocols = useMemo(() => codes['AAS_PROTOCOL'] ?? [], [codes]);
  const byteOrders = useMemo(() => codes['MODBUS_BYTE_ORDER'] ?? [], [codes]);
  const wordOrders = useMemo(() => codes['MODBUS_WORD_ORDER'] ?? [], [codes]);

  // Asset Instance 목록 로드
  useEffect(() => {
    (async () => {
      try {
        const res = await authFetch('/api/aas/instances');
        if (res.ok) {
          const json = await res.json();
          const rawList = json.data ?? json;
          const list: AssetInstanceOption[] = (Array.isArray(rawList) ? rawList : []).map(
            (o: { seq_id?: number; id?: number; instance_id: string; instance_name: string }) => ({
              id: o.seq_id ?? o.id ?? 0,
              instance_id: o.instance_id,
              instance_name: o.instance_name,
            })
          );
          setInstanceOptions(list);
        }
      } catch { /* 인스턴스 목록 로드 실패 -- 빈 배열로 폴백 */ }
    })();
  }, []);

  // asset_instance_id (seq_id) 기반 드롭다운 values
  const instanceIdValues = useMemo(
    () => ['', ...instanceOptions.map(o => String(o.id))],
    [instanceOptions]
  );

  const instanceNameById = useMemo(() => {
    const map = new Map<string, string>();
    instanceOptions.forEach(o => map.set(String(o.id), o.instance_name));
    return map;
  }, [instanceOptions]);


  const loadSources = useCallback(async () => {
    setLoading(true);
    try {
      const res = await authFetch('/api/opcua/data-sources');
      if (!res.ok) throw new Error('로드 실패');
      setSources(await res.json());
    } catch {
      notify(t('message.loadFailed', '데이터소스 로드 실패'), { type: 'error' });
    } finally {
      setLoading(false);
    }
  }, [notify, t]);

  useEffect(() => { loadSources(); }, [loadSources]);

  const filteredSources = useMemo(
    () => sources.filter(s => s.source_type === typeFilter),
    [sources, typeFilter]
  );

  const columns = useMemo<ColDef<DataSourceRow>[]>(() => {
    const assetInstanceIdCol: ColDef<DataSourceRow> = {
      headerName: t('page.aas.connection.assetInstance', 'Asset Instance'), field: 'asset_instance_id', width: 200,
      editable: true,
      cellEditor: 'agSelectCellEditor',
      cellEditorParams: { values: instanceIdValues },
      valueGetter: (p) => p.data?.asset_instance_id != null ? String(p.data.asset_instance_id) : '',
      valueSetter: (p) => {
        const val = p.newValue == null || p.newValue === '' ? null : Number(p.newValue);
        p.data.asset_instance_id = val;
        // 캐시 필드 업데이트 (서버 응답에서도 반영되지만 로컬 즉시 표시)
        const name = val != null ? instanceNameById.get(String(val)) : null;
        p.data.asset_instance_name = name ?? null;
        // asset_instance_code도 동기 (하위 호환)
        const opt = instanceOptions.find(o => o.id === val);
        p.data.asset_instance_code = opt?.instance_id ?? null;
        return true;
      },
      valueFormatter: (p) => {
        if (!p.value) return '';
        const name = instanceNameById.get(String(p.value));
        return name ? `${name}` : String(p.value);
      },
    };
    const assetNameCol: ColDef<DataSourceRow> = {
      headerName: t('page.aas.connection.assetInstanceName', '인스턴스명'), field: 'asset_instance_name', width: 140,
      editable: false,
    };
    const sourceIdCol: ColDef<DataSourceRow> = {
      headerName: 'Source ID', field: 'source_id', width: 120,
      editable: (p) => !p.data?.id,
      headerClass: 'ag-header-required',
    };
    const nameCol: ColDef<DataSourceRow> = {
      headerName: 'Source 이름', field: 'source_name', width: 160, editable: true,
      headerClass: 'ag-header-required',
    };
    const typeCol: ColDef<DataSourceRow> = {
      headerName: '유형', field: 'source_type', width: 110,
      cellEditor: 'agSelectCellEditor',
      cellEditorParams: { values: sourceTypes.length > 0 ? sourceTypes.map(c => c.code) : ['PLC', 'VISION'] },
      valueFormatter: (p) => {
        const found = sourceTypes.find(c => c.code === p.value);
        return found ? found.codeName : (p.value ?? '');
      },
      editable: true,
      headerClass: 'ag-header-required',
    };
    const protocolCol: ColDef<DataSourceRow> = {
      headerName: '프로토콜', field: 'plc_protocol', width: 160,
      editable: true,
      cellEditor: 'agSelectCellEditor',
      cellEditorParams: { values: protocols.length > 0 ? ['', ...protocols.map(c => c.code)] : ['', 'MODBUS_TCP', 'SMB', 'RS232', 'RS485', 'PROFINET', 'ETHERCAT', 'CANOPEN', 'BACNET'] },
      valueFormatter: (p) => {
        if (!p.value) return '';
        const found = protocols.find(c => c.code === p.value);
        return found ? found.codeName : (p.value ?? '');
      },
    };
    const ipCol: ColDef<DataSourceRow> = {
      headerName: 'IP/Host', field: 'plc_ip', width: 140, editable: true,
    };
    const portCol: ColDef<DataSourceRow> = {
      headerName: '포트', field: 'plc_port', width: 70, type: 'numericColumn', editable: true,
    };
    const unitIdCol: ColDef<DataSourceRow> = {
      headerName: 'Unit ID', field: 'unit_id', width: 80, type: 'numericColumn', editable: true,
    };
    const addressBaseCol: ColDef<DataSourceRow> = {
      headerName: '주소 베이스', field: 'address_base', width: 100,
      editable: true,
      cellEditor: 'agSelectCellEditor',
      cellEditorParams: { values: ['0', '1'] },
      valueFormatter: (p) => p.value === 0 || p.value === '0' ? '0-base' : p.value === 1 || p.value === '1' ? '1-base' : '',
      valueParser: (p) => p.newValue == null || p.newValue === '' ? null : Number(p.newValue),
    };
    const byteOrderCol: ColDef<DataSourceRow> = {
      headerName: '바이트 순서', field: 'byte_order', width: 160,
      editable: true,
      cellEditor: 'agSelectCellEditor',
      cellEditorParams: { values: byteOrders.length > 0 ? byteOrders.map(c => c.code) : ['BIG_ENDIAN', 'LITTLE_ENDIAN'] },
      valueFormatter: (p) => { const f = byteOrders.find(c => c.code === p.value); return f ? f.codeName : (p.value ?? ''); },
    };
    const wordOrderCol: ColDef<DataSourceRow> = {
      headerName: '워드 순서', field: 'word_order', width: 180,
      editable: true,
      cellEditor: 'agSelectCellEditor',
      cellEditorParams: { values: wordOrders.length > 0 ? wordOrders.map(c => c.code) : ['HIGH_WORD_FIRST', 'LOW_WORD_FIRST'] },
      valueFormatter: (p) => { const f = wordOrders.find(c => c.code === p.value); return f ? f.codeName : (p.value ?? ''); },
    };
    const folderCol: ColDef<DataSourceRow> = {
      headerName: '폴더 경로', field: 'vision_watch_folder', width: 220, editable: true,
    };
    const patternCol: ColDef<DataSourceRow> = {
      headerName: '파일 유형', field: 'vision_csv_pattern', width: 130, editable: true,
    };
    const statusCol: ColDef<DataSourceRow> = {
      headerName: '상태', field: 'status', width: 90,
      cellEditor: 'agSelectCellEditor',
      cellEditorParams: { values: ['ACTIVE', 'INACTIVE', 'ERROR'] },
      editable: true,
    };
    const useCol: ColDef<DataSourceRow> = {
      headerName: '사용여부', field: 'use_yn', width: 80,
      cellEditor: 'agSelectCellEditor',
      cellEditorParams: { values: ['Y', 'N'] },
      editable: true,
    };
    const testCol: ColDef<DataSourceRow> = {
      headerName: '연결 테스트', colId: 'testBtn', width: 100,
      cellRenderer: TestConnectionRenderer,
      cellRendererParams: { notify },
      editable: false, sortable: false, filter: false,
    };

    const typeSpecific: ColDef<DataSourceRow>[] =
      typeFilter === 'VISION' ? [folderCol, patternCol] :
      typeFilter === 'PLC'    ? [ipCol, portCol, unitIdCol, addressBaseCol, byteOrderCol, wordOrderCol] :
                                [ipCol, portCol, folderCol, patternCol];

    return [assetInstanceIdCol, assetNameCol, sourceIdCol, nameCol, typeCol, protocolCol, ...typeSpecific, statusCol, testCol, useCol];
  }, [notify, instanceIdValues, instanceNameById, instanceOptions, sourceTypes, protocols, typeFilter, byteOrders, wordOrders, t]);

  const handleBatchSave = useCallback(async (
    rows: { _rowState: string; [key: string]: unknown }[]
  ): Promise<void> => {
    const created = rows.filter(r => r._rowState === 'created') as unknown as DataSourceRow[];
    const updated = rows.filter(r => r._rowState === 'updated') as unknown as DataSourceRow[];
    const deleted = rows.filter(r => r._rowState === 'deleted') as unknown as DataSourceRow[];
    let success = true;

    for (const item of deleted) {
      if (!item.source_id) continue;
      try {
        const res = await authFetch(
          `/api/opcua/data-sources/${encodeURIComponent(item.source_id)}`,
          { method: 'DELETE' }
        );
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

    for (const item of created) {
      if (!item.source_id) {
        notify('Source ID는 필수 입력 항목입니다.', { type: 'error' });
        success = false;
        continue;
      }
      if (!item.source_name) {
        notify('이름은 필수 입력 항목입니다.', { type: 'error' });
        success = false;
        continue;
      }
      try {
        const res = await authFetch('/api/opcua/data-sources', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            source_id: item.source_id,
            source_name: item.source_name,
            source_type: item.source_type || typeFilter,
            plc_protocol: item.plc_protocol ?? null,
            plc_ip: item.plc_ip ?? null,
            plc_port: item.plc_port ?? null,
            unit_id: item.unit_id ?? null,
            address_base: item.address_base ?? null,
            byte_order: item.byte_order ?? null,
            word_order: item.word_order ?? null,
            vision_watch_folder: item.vision_watch_folder ?? null,
            vision_csv_pattern: item.vision_csv_pattern ?? null,
            status: item.status || 'ACTIVE',
            asset_instance_code: item.asset_instance_code ?? null,
            asset_instance_name: item.asset_instance_name ?? null,
            asset_instance_id: item.asset_instance_id ?? null,
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

    for (const item of updated) {
      if (!item.source_id) continue;
      try {
        const res = await authFetch(
          `/api/opcua/data-sources/${encodeURIComponent(item.source_id)}`,
          {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              source_id: item.source_id,
              source_name: item.source_name,
              source_type: item.source_type,
              plc_protocol: item.plc_protocol ?? null,
              plc_ip: item.plc_ip ?? null,
              plc_port: item.plc_port ?? null,
              unit_id: item.unit_id ?? null,
              address_base: item.address_base ?? null,
              byte_order: item.byte_order ?? null,
              word_order: item.word_order ?? null,
              vision_watch_folder: item.vision_watch_folder ?? null,
              vision_csv_pattern: item.vision_csv_pattern ?? null,
              status: item.status,
              asset_instance_code: item.asset_instance_code ?? null,
              asset_instance_name: item.asset_instance_name ?? null,
              asset_instance_id: item.asset_instance_id ?? null,
            }),
          }
        );
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
      notify(t('message.saveSuccess', '저장되었습니다.'), { type: 'success' });
      await loadSources();
    }
  }, [notify, loadSources, t, typeFilter]);

  const filterLabels: Record<string, string> = useMemo(() => {
    const map: Record<string, string> = {};
    sourceTypes.forEach(c => { map[c.code] = c.codeName; });
    if (sourceTypes.length === 0) {
      map['PLC'] = 'PLC';
      map['VISION'] = '비전';
    }
    return map;
  }, [sourceTypes]);

  const filterValues = useMemo(() => {
    if (sourceTypes.length === 0) return ['PLC', 'VISION'];
    // PLC 먼저, VISION 두 번째, 나머지 원래 순서 유지
    const codes = sourceTypes.map(c => c.code);
    return [...codes].sort((a, b) => {
      const priority = (v: string) => v === 'PLC' ? 0 : v === 'VISION' ? 1 : 2 + codes.indexOf(v);
      return priority(a) - priority(b);
    });
  }, [sourceTypes]);

  const extraToolbarButtons = useMemo(() => (
    <>
      {perm.canCreate && (
        <button
          className="mes-btn"
          onClick={() => gridRef.current?.appendRow({
            source_id: '', source_name: '', source_type: typeFilter, status: 'ACTIVE', use_yn: 'Y',
            ...(typeFilter === 'PLC' ? { address_base: 0, byte_order: 'BIG_ENDIAN', word_order: 'HIGH_WORD_FIRST' } : {}),
          })}
        >
          + 행 추가
        </button>
      )}
      {perm.canDelete && (
        <button className="mes-btn" onClick={() => gridRef.current?.deleteSelectedRows()}>
          - 행 삭제
        </button>
      )}
    </>
  ), [perm.canCreate, perm.canDelete, typeFilter]);

  return (
    <div className="flex flex-col h-full overflow-hidden">
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 8 }}>
        <PageTitle />
        <button
          className="mes-btn"
          style={{ padding: '2px 8px', fontSize: 14, lineHeight: 1 }}
          title="PLC 연결 설정 도움말"
          onClick={() => setHelpOpen(true)}
        >
          ?
        </button>
        <div style={{ display: 'flex', gap: 6 }}>
          {filterValues.map(type => (
            <button
              key={type}
              className="mes-btn"
              style={typeFilter === type ? { fontWeight: 700, borderColor: 'var(--color-primary)' } : undefined}
              onClick={() => setTypeFilter(type)}
            >
              {filterLabels[type] ?? type}
            </button>
          ))}
        </div>
      </div>
      <PeakEditGrid
        ref={gridRef}
        gridId={`aa0040-${typeFilter.toLowerCase()}-v4`}
        data={filteredSources}
        columns={columns}
        permission={perm}
        showCheckbox
        hideRowButtons
        extraToolbarButtons={extraToolbarButtons}
        onBatchSave={handleBatchSave}
        hideTotalRow
        bodyHeight="fitToParent"
        loading={loading}
      />
      <PlcConnectionHelpModal open={helpOpen} onClose={() => setHelpOpen(false)} />
    </div>
  );
}
