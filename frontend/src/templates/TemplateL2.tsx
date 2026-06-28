/**
 * [L2] 분할 그리드 템플릿
 *
 * 사용 상황: 마스터 목록 선택 → 하위 디테일 그리드 연동
 * 대표 메뉴: 수주+일정, 품질기준+Spec, 공정별약품+약품항목
 *
 * 레이아웃 옵션:
 *   - 상하 분할 (기본): 아래 코드 그대로 사용
 *   - 좌우 분할: children 안의 flex-direction을 'row'로 변경하고
 *               상단/하단 div의 flex 비율을 width로 대체.
 *               또는 peakmate-core SplitPanel 컴포넌트 사용:
 *               <SplitPanel left={<마스터그리드/>} right={<디테일그리드/>} leftWidth="45%" height="100%" />
 *
 * 복사 후 처리:
 *   1. MENU_CODE, MASTER_API, DETAIL_API 교체
 *   2. MasterRow, DetailRow 타입 정의
 *   3. masterColumns, detailColumns 정의 작성
 *   4. 상단 그리드 비율(flex: '0 0 40%') 조정
 */

import { useState, useCallback, useEffect, useMemo, useRef } from 'react';
import type { ColDef } from 'ag-grid-community';
import { useTranslation } from 'react-i18next';
import { authFetch } from '@/lib/api';
import { usePermission } from '@/hooks/usePermission';
import { useDateRange } from '@/hooks/useDateRange';
import { useCommonCodes } from '@/hooks/useCommonCodes';
import { useToast } from '@/shared/components/toast/useToast';
import { PageFilterShell } from '@/components/layout/PageFilterShell';
import { PeakDataGrid } from '@/components/grid/PeakDataGrid';
import { PeakEditGrid } from '@/components/grid';
import type { PeakEditGridRef } from '@/components/grid';
import { DateRangeFilter } from '@/components/ui/DateRangeFilter';
import { DropdownFilter } from '@/components/ui/DropdownFilter';
import { FilterField } from '@/components/ui/FilterField';
import { RefreshButton } from '@/components/ui/RefreshButton';

// TODO: 메뉴코드 + API 경로 교체
const MENU_CODE = 'XX0000';
const MASTER_API = '/api/xxx/master';
const DETAIL_API = '/api/xxx/detail';

// TODO: 마스터/디테일 타입 정의
interface MasterRow {
  id: number;
  code: string;
  name: string;
}

interface DetailRow {
  id?: number;
  masterId: number;
  seq?: number;
  value?: string;
  [key: string]: unknown;
}

export default function TemplateL2Page() {
  const { t } = useTranslation();
  const { notify } = useToast();
  const perm = usePermission(MENU_CODE);
  const detailGridRef = useRef<PeakEditGridRef>(null);

  // 필터 상태 (마스터 목록 검색용)
  const { dateFrom, dateTo, setDateFrom, setDateTo } = useDateRange();
  const [statusFilter, setStatusFilter] = useState('');
  const [refetchTrigger, setRefetchTrigger] = useState(0);

  // TODO: 필요한 공통코드 그룹 추가
  const allCodes = useCommonCodes('STATUS_CODE');
  const statusOptions = allCodes['STATUS_CODE'] ?? [];

  // 마스터 선택 상태
  const [selectedMaster, setSelectedMaster] = useState<MasterRow | null>(null);

  // 디테일 데이터
  const [detailData, setDetailData] = useState<DetailRow[]>([]);

  const fetchDetail = useCallback(async (masterId: number) => {
    try {
      const res = await authFetch(`${DETAIL_API}?masterId=${masterId}`);
      if (!res.ok) throw new Error('디테일 조회 실패');
      const json = await res.json();
      setDetailData(json.data?.content ?? json.data ?? []);
    } catch (e) {
      notify(e instanceof Error ? e.message : '디테일 조회 중 오류가 발생했습니다', { type: 'error' });
    }
  }, [notify]);

  const handleMasterSelect = useCallback((row: MasterRow) => {
    setSelectedMaster(row);
    fetchDetail(row.id);
  }, [fetchDetail]);

  // 마스터 선택 해제 시 디테일 초기화
  useEffect(() => {
    if (!selectedMaster) setDetailData([]);
  }, [selectedMaster]);

  // TODO: 마스터 컬럼 정의
  const masterColumns = useMemo<ColDef<MasterRow>[]>(() => [
    { field: 'code', headerName: '코드', width: 130 },
    { field: 'name', headerName: '명칭', flex: 1 },
  ], []);

  // TODO: 디테일 컬럼 정의
  const detailColumns = useMemo<ColDef<DetailRow>[]>(() => [
    { field: 'seq',   headerName: '순번', width: 70 },
    { field: 'value', headerName: '값',   flex: 1, editable: true },
  ], []);

  const handleDetailBatchSave = useCallback(async (
    rows: { _rowState: string; [key: string]: unknown }[],
  ) => {
    if (!selectedMaster) return;
    const payload = rows.map((r) => ({ ...r, masterId: selectedMaster.id }));
    const res = await authFetch(`${DETAIL_API}/batch`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({ message: '서버 응답을 처리할 수 없습니다' }));
      throw new Error(err?.message ?? '저장에 실패했습니다.');
    }
    await fetchDetail(selectedMaster.id);
    notify('저장되었습니다', { type: 'success' });
  }, [selectedMaster, fetchDetail, notify]);

  const masterExtraParams = useMemo<Record<string, string | undefined>>(() => ({
    ...(dateFrom && { startDate: dateFrom }),
    ...(dateTo && { endDate: dateTo }),
    ...(statusFilter && { status: statusFilter }),
  }), [dateFrom, dateTo, statusFilter]);

  return (
    <PageFilterShell
      title={t(`menu.${MENU_CODE}`)}
      toolbar={
        <>
          <DateRangeFilter
            label="기간"
            dateFrom={dateFrom} dateTo={dateTo}
            onDateFromChange={setDateFrom} onDateToChange={setDateTo}
          />
          <FilterField label="필터링:">
            <div style={{ display: 'flex', gap: 2 }}>
              <DropdownFilter
                options={statusOptions.map(c => ({ value: c.code, label: c.codeName }))} value={statusFilter} onChange={setStatusFilter}
                allLabel="상태 전체" width={110}
              />
            </div>
          </FilterField>
        </>
      }
      toolbarRight={
        <RefreshButton onRefresh={() => setRefetchTrigger((v) => v + 1)} />
      }
    >
      {/* 상하 분할 레이아웃 — height: 100%는 PageFilterShell > GridFill이 보장 */}
      <div style={{ display: 'flex', flexDirection: 'column', height: '100%', gap: 8 }}>

        {/* 상단: 마스터 목록 (읽기 전용, 서버 페이징) */}
        <div style={{ flex: '0 0 40%', minHeight: 0, overflow: 'hidden' }}>
          <PeakDataGrid<MasterRow>
            queryKey={[MENU_CODE, 'master', dateFrom ?? '', dateTo ?? '', statusFilter]}
            queryUrl={MASTER_API.replace('/api', '')}
            columns={masterColumns}
            extraParams={masterExtraParams}
            onRowClick={handleMasterSelect}
            refetchTrigger={refetchTrigger}
            permission={{ canExport: perm.canExport }}
          />
        </div>

        {/* 하단: 디테일 그리드 (인라인 편집) */}
        <div style={{ flex: 1, minHeight: 0, overflow: 'hidden' }}>
          {selectedMaster ? (
            <PeakEditGrid
              ref={detailGridRef}
              gridId={`${MENU_CODE}-detail`}
              columns={detailColumns}
              data={detailData}
              onBatchSave={handleDetailBatchSave}
              permission={perm}
            />
          ) : (
            <div style={{
              height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center',
              color: '#94a3b8', fontSize: 13, border: '1px dashed #e2e8f0', borderRadius: 6,
            }}>
              상단 목록에서 항목을 선택하세요
            </div>
          )}
        </div>

      </div>
    </PageFilterShell>
  );
}
