import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { AllCommunityModule, ModuleRegistry, type ColDef } from 'ag-grid-community';
import { authFetch } from '@/lib/api';
import { usePermission } from '@/hooks/usePermission';
import { useTranslation } from 'react-i18next';
import { useToast } from '@/shared/components/toast/ToastProvider';
import { PageTitle } from '@/components/ui/PageTitle';
import { DropDown } from '@/components/ui/DropDown';
import { PeakEditGrid } from '@/components/grid';
import type { PeakEditGridRef } from '@/components/grid';
import type { LinkResult } from '../types';
import { LinkStatusBadge } from './LinkStatusBadge';
import { LinkedColCellRenderer } from './LinkedColCellRenderer';
import { LinkButtonCell } from './LinkButtonCell';
import { LinkMasterModal } from './LinkMasterModal';

ModuleRegistry.registerModules([AllCommunityModule]);

const CACHE_TTL_MS = 60 * 60 * 1000; // 1시간
const pageCache = {
  assetTypes: null as { data: AssetTypeOption[]; ts: number } | null,
  instances: new Map<string, { data: Record<string, unknown>[]; ts: number }>(),
  selectedTypeCode: '',
};

interface AssetTypeOption {
  type_code: string;
  type_name: string;
}

interface LinkModalState {
  open: boolean;
  instanceId: number | null;
  rowId: string | null;
  currentMenuCode?: string;
}

export default function AasInstancesPage() {
  const { t } = useTranslation();
  const { notify } = useToast();
  const perm = usePermission('AA0020');

  const gridRef = useRef<PeakEditGridRef>(null);
  const [assetTypes, setAssetTypes] = useState<AssetTypeOption[]>(pageCache.assetTypes?.data ?? []);
  const [selectedTypeCode, setSelectedTypeCode] = useState(pageCache.selectedTypeCode);
  const [instanceData, setInstanceData] = useState<Record<string, unknown>[]>(() => {
    const cached = pageCache.instances.get(pageCache.selectedTypeCode);
    return cached ? cached.data : [];
  });
  const [linkModal, setLinkModal] = useState<LinkModalState>({
    open: false, instanceId: null, rowId: null,
  });

  // =========================================================================
  // Asset Type 목록 로드 (최초 1회)
  // =========================================================================

  const loadData = useCallback(async (typeCode: string, forceRefresh = false) => {
    if (!typeCode) return;
    pageCache.selectedTypeCode = typeCode;
    if (!forceRefresh) {
      const cached = pageCache.instances.get(typeCode);
      if (cached && Date.now() - cached.ts < CACHE_TTL_MS) {
        setInstanceData(cached.data);
        return;
      }
    }
    try {
      const res = await authFetch(`/api/aas/instances?typeCode=${encodeURIComponent(typeCode)}`);
      if (!res.ok) { notify(t('message.loadFailed', '데이터 로드 실패'), { type: 'error' }); return; }
      const json = await res.json();
      const instances = (json.data ?? []) as Record<string, unknown>[];
      const mapped = instances.map(r => ({
        ...r,
        id:             r.id,
        instanceId:     r.instance_id,
        instanceName:   r.instance_name,
        typeCode:       r.type_code,
        locationFloor:  r.location_floor,
        serialNumber:   r.serial_number,
        linkedMenuCode: r.linked_menu_code,
        linkedRecordId: r.linked_record_id,
        linkStatus:     (r.link_status as string) ?? 'STANDALONE',
        linkedColumns:  (r.linked_columns as unknown[]) ?? [],
      }));
      pageCache.instances.set(typeCode, { data: mapped, ts: Date.now() });
      setInstanceData(mapped);
    } catch {
      notify(t('message.networkError', '네트워크 오류가 발생했습니다'), { type: 'error' });
    }
  }, [notify, t]);

  // =========================================================================
  // Asset Type 목록 로드 + 첫 번째 타입의 인스턴스 자동 로드 (최초 1회)
  // =========================================================================

  useEffect(() => {
    const init = async () => {
      // 캐시 유효 시 API 호출 없이 복원
      if (
        pageCache.assetTypes &&
        Date.now() - pageCache.assetTypes.ts < CACHE_TTL_MS &&
        pageCache.selectedTypeCode
      ) {
        const cached = pageCache.instances.get(pageCache.selectedTypeCode);
        if (cached && Date.now() - cached.ts < CACHE_TTL_MS) return;
        await loadData(pageCache.selectedTypeCode);
        return;
      }
      try {
        const res = await authFetch('/api/aas/asset-types');
        if (!res.ok) { notify(t('message.loadFailed', '타입 로드 실패'), { type: 'error' }); return; }
        const json = await res.json();
        const types = (json.data ?? []) as AssetTypeOption[];
        pageCache.assetTypes = { data: types, ts: Date.now() };
        setAssetTypes(types);
        if (types.length > 0) {
          const typeCode = pageCache.selectedTypeCode || types[0].type_code;
          setSelectedTypeCode(typeCode);
          await loadData(typeCode);
        }
      } catch {
        notify(t('message.networkError', '네트워크 오류가 발생했습니다'), { type: 'error' });
      }
    };
    init();
  }, [loadData, notify, t]);

  // =========================================================================
  // 저장 (Q6 A안: batch payload에 link 정보 포함)
  // =========================================================================

  const handleBatchSave = useCallback(async (
    rows: { _rowState: string; [key: string]: unknown }[],
  ) => {
    for (const row of rows.filter(r => r._rowState !== 'deleted')) {
      if (!String(row.instanceId ?? '').trim())
        throw new Error('Asset ID는 필수입니다.');
      if (!String(row.instanceName ?? '').trim())
        throw new Error('이름은 필수입니다.');
      const cols = row.linkedColumns as unknown[];
      if (!cols || cols.length === 0)
        throw new Error(`[${row.instanceId ?? '신규 행'}] 기준정보 연결이 최소 1개 필요합니다.`);
    }

    const payload = {
      created: rows.filter(r => r._rowState === 'created').map(r => ({
        instanceId:     r.instanceId,
        instanceName:   r.instanceName,
        typeCode:       selectedTypeCode,
        locationFloor:  r.locationFloor   ?? null,
        serialNumber:   r.serialNumber    ?? null,
        linkedMenuCode: r.linkedMenuCode  ?? null,
        linkedRecordId: r.linkedRecordId  ?? null,
        linkedColumns:  (r.linkedColumns as unknown[] ?? []).length > 0
                          ? r.linkedColumns : null,
      })),
      updated: rows.filter(r => r._rowState === 'updated').map(r => ({
        id:            r.id,
        instanceId:    r.instanceId,
        instanceName:  r.instanceName,
        typeCode:      selectedTypeCode,
        locationFloor: r.locationFloor   ?? null,
        serialNumber:  r.serialNumber    ?? null,
      })),
      deleted: rows.filter(r => r._rowState === 'deleted' && r.id)
                   .map(r => r.id),
    };

    const res = await authFetch('/api/aas/instances', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    if (!res.ok) {
      const json = await res.json().catch(() => ({ message: '서버 응답을 처리할 수 없습니다' }));
      const msg = json.error?.message ?? json.message ?? '저장 실패';
      notify(msg, { type: 'error' });
      throw new Error(msg);
    }
    notify('저장되었습니다.', { type: 'success' });
    await loadData(selectedTypeCode, true);
  }, [loadData, notify, selectedTypeCode]);

  // =========================================================================
  // 연결 팝업
  // =========================================================================

  const handleOpenLinkModal = useCallback((row: Record<string, unknown>) => {
    setLinkModal({
      open:            true,
      instanceId:      (row.id as number) ?? null,
      rowId:           row.__rowId as string ?? null,
      currentMenuCode: row.linkedMenuCode as string | undefined,
    });
  }, []);

  const handleLinkConfirm = async (result: LinkResult) => {
    const { instanceId, rowId } = linkModal;

    if (instanceId) {
      try {
        const res = await authFetch(`/api/aas/instances/${instanceId}/link`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            menuCode: result.menuCode,
            recordId: result.recordId,
            columns:  result.columns,
          }),
        });
        if (!res.ok) {
          const json = await res.json().catch(() => ({ message: '서버 응답을 처리할 수 없습니다' }));
          notify(json.error?.message ?? '연결 저장 실패', { type: 'error' });
          return;
        }
        notify('연결되었습니다.', { type: 'success' });
        await loadData(selectedTypeCode, true);
      } catch {
        notify('연결 저장 중 오류가 발생했습니다', { type: 'error' });
        return;
      }
    } else if (rowId) {
      const allRows = gridRef.current?.getAllRows() ?? [];
      const absIdx  = allRows.findIndex(r => r.__rowId === rowId);
      if (absIdx >= 0) {
        gridRef.current?.updateRowAt(absIdx, {
          linkedMenuCode: result.menuCode,
          linkedRecordId: result.recordId,
          linkedColumns:  result.columns,
          linkStatus:     'LINKED',
        });
      }
    }
    setLinkModal({ open: false, instanceId: null, rowId: null });
  };

  // =========================================================================
  // 컬럼 정의
  // =========================================================================

  const columns = useMemo((): ColDef[] => [
    {
      headerName: 'Asset ID', field: 'instanceId', width: 130,
      editable: (p) => !p.data?.id,
      headerClass: 'ag-header-required',
    },
    {
      headerName: '이름', field: 'instanceName', width: 160, editable: true,
      headerClass: 'ag-header-required',
    },
    ...([0, 1, 2, 3, 4] as const).map(i => ({
      headerName: `연결 정보 ${i + 1}`,
      colId: `linkedCol${i}`,
      width: 150,
      valueGetter: (p: { data?: Record<string, unknown> }) => {
        const cols = p.data?.linkedColumns as { value?: string }[] | undefined;
        return cols?.[i]?.value ?? '';
      },
      cellRenderer: LinkedColCellRenderer,
      cellRendererParams: { index: i },
      sortable: false, filter: false, editable: false,
    })),
    {
      headerName: '연결 상태', field: 'linkStatus', width: 100,
      cellRenderer: LinkStatusBadge,
      sortable: false, filter: false, editable: false,
    },
    {
      headerName: '연결', colId: 'linkBtn', width: 80,
      cellRenderer: LinkButtonCell,
      cellRendererParams: { onOpenLink: handleOpenLinkModal },
      sortable: false, filter: false, editable: false,
    },
  ], [handleOpenLinkModal]);

  // =========================================================================
  // 툴바 버튼
  // =========================================================================

  const extraToolbarButtons = useMemo(() => (
    <>
      {perm.canCreate && (
        <button className="mes-btn" onClick={() => gridRef.current?.appendRow({
          instanceId: '', instanceName: '', typeCode: selectedTypeCode,
          linkStatus: 'STANDALONE', linkedColumns: [],
        })}>
          + 행 추가
        </button>
      )}
      {perm.canDelete && (
        <button className="mes-btn" onClick={() => gridRef.current?.deleteSelectedRows()}>
          - 행 삭제
        </button>
      )}
    </>
  ), [perm.canCreate, perm.canDelete, selectedTypeCode]);

  // =========================================================================
  // 렌더
  // =========================================================================

  return (
    <div className="flex flex-col h-full overflow-hidden">
      <div className="flex items-center gap-3 mb-1">
        <PageTitle menuCode="AA0020" />
        {assetTypes.length > 0 ? (
          <DropDown
            options={assetTypes.map(t => ({ value: t.type_code, label: t.type_name }))}
            value={selectedTypeCode}
            onChange={e => { setSelectedTypeCode(String(e.target.value)); loadData(String(e.target.value)); }}
            btnWidth={180}
            heightType="h32"
          />
        ) : (
          <span className="text-sm text-gray-400">Asset Type 없음 — AA0010에서 먼저 등록하세요</span>
        )}
      </div>

      <PeakEditGrid
        ref={gridRef}
        gridId="asset-instance-v4"
        data={instanceData}
        columns={columns}
        permission={perm}
        showCheckbox
        hideRowButtons
        extraToolbarButtons={extraToolbarButtons}
        onBatchSave={handleBatchSave}
        bodyHeight="fitToParent"
      />

      <LinkMasterModal
        open={linkModal.open}
        instanceId={linkModal.instanceId}
        tempRowId={linkModal.rowId ?? undefined}
        currentMenuCode={linkModal.currentMenuCode}
        onClose={() => setLinkModal({ open: false, instanceId: null, rowId: null })}
        onConfirm={handleLinkConfirm}
      />
    </div>
  );
}
