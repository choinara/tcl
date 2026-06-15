import { useState, useCallback, useEffect, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { useQuery } from '@tanstack/react-query';
import { authFetch } from '@/lib/api';
import { usePermission } from '@/hooks/usePermission';
import { PageFilterShell } from '@/components/layout/PageFilterShell';
import { useToast } from '@/shared/components/toast/ToastProvider';
import { useCommonCodes } from '@/hooks/useCommonCodes';
import { LossStackedBarChart } from '@/components/charts';
import { AllCommunityModule, ModuleRegistry, type ColDef } from 'ag-grid-community';
import { AgGridReact } from 'ag-grid-react';
ModuleRegistry.registerModules([AllCommunityModule]);

interface LossTypeEntry { code: string }
interface DailyDataEntry { lossTypeCode: string; values: number[] }
interface EquipEntry { id: number; unitNumber: string; lineName: string; category: string }

interface DailyQueryResult {
  days: number[];
  lossTypes: LossTypeEntry[];
  data: DailyDataEntry[];
}
interface EquipQueryResult {
  equipment: EquipEntry[];
  lossTypes: LossTypeEntry[];
  data: DailyDataEntry[];
}
interface LossSearchParams { yearMonth: string; equipCategoryCode: string }

export default function EquipLossMgmtPage() {
  const { t } = useTranslation();
  const perm = usePermission('ET0060');
  void perm;
  const { notify } = useToast();
  const codes = useCommonCodes('EQUIP_FAIL_TYPE', 'EQUIP_CATEGORY');
  const failTypes = useMemo(() => codes['EQUIP_FAIL_TYPE'] ?? [], [codes]);
  const equipCategories = useMemo(() => codes['EQUIP_CATEGORY'] ?? [], [codes]);

  const [yearMonth, setYearMonth] = useState(() => {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
  });
  const [equipCategoryCode, setEquipCategoryCode] = useState('');
  const [activeTab, setActiveTab] = useState<'daily' | 'equip'>('daily');
  const [searchParams, setSearchParams] = useState<LossSearchParams>({ yearMonth, equipCategoryCode });

  const handleSearch = useCallback(() => {
    setSearchParams({ yearMonth, equipCategoryCode });
  }, [yearMonth, equipCategoryCode]);

  const getCodeName = useCallback((code: string) => {
    const c = failTypes.find(f => f.code === code);
    return c ? (c.codeName as string ?? code) : code;
  }, [failTypes]);

  const { data: dailyRaw, isFetching: dailyLoading, error: dailyError } = useQuery<DailyQueryResult>({
    queryKey: ['et-loss-daily', searchParams.yearMonth, searchParams.equipCategoryCode],
    queryFn: async ({ signal }) => {
      const params = new URLSearchParams({ yearMonth: searchParams.yearMonth });
      if (searchParams.equipCategoryCode) params.set('equipCategoryCode', searchParams.equipCategoryCode);
      const res = await authFetch(`/api/et/loss/analysis/daily?${params}`, { signal });
      if (!res.ok) throw new Error('일자별 Loss 분석 조회 실패');
      const json = await res.json();
      return json.data as DailyQueryResult;
    },
    refetchOnWindowFocus: false,
  });

  const { data: equipRaw, isFetching: equipLoading, error: equipError } = useQuery<EquipQueryResult>({
    queryKey: ['et-loss-equip', searchParams.yearMonth, searchParams.equipCategoryCode],
    queryFn: async ({ signal }) => {
      const params = new URLSearchParams({ yearMonth: searchParams.yearMonth });
      if (searchParams.equipCategoryCode) params.set('equipCategoryCode', searchParams.equipCategoryCode);
      const res = await authFetch(`/api/et/loss/analysis/equip?${params}`, { signal });
      if (!res.ok) throw new Error('설비별 Loss 분석 조회 실패');
      const json = await res.json();
      return json.data as EquipQueryResult;
    },
    refetchOnWindowFocus: false,
  });

  useEffect(() => {
    if (dailyError) notify(t('message.networkError', '일자별 Loss 분석 조회에 실패했습니다'), { type: 'error' });
  }, [dailyError, notify, t]);

  useEffect(() => {
    if (equipError) notify(t('message.networkError', '설비별 Loss 분석 조회에 실패했습니다'), { type: 'error' });
  }, [equipError, notify, t]);

  // daily chart data
  const dailyXLabels = useMemo(() =>
    (dailyRaw?.days ?? []).map(d => `${d}일`), [dailyRaw]);
  const dailySeries = useMemo(() =>
    (dailyRaw?.data ?? []).map(entry => ({
      name: getCodeName(entry.lossTypeCode),
      data: entry.values,
    })), [dailyRaw, getCodeName]);

  // equip chart data
  const equipXLabels = useMemo(() =>
    (equipRaw?.equipment ?? []).map(eq => `${eq.unitNumber}-${eq.lineName}`), [equipRaw]);
  const equipSeries = useMemo(() =>
    (equipRaw?.data ?? []).map(entry => ({
      name: getCodeName(entry.lossTypeCode),
      data: entry.values,
    })), [equipRaw, getCodeName]);

  // daily table
  const dailyDays = useMemo(() => dailyRaw?.days ?? [], [dailyRaw]);
  const dailyData = useMemo(() => dailyRaw?.data ?? [], [dailyRaw]);

  const dailyTableCols = useMemo<ColDef[]>(() => [
    { headerName: 'Loss유형', field: 'lossTypeName', width: 120, pinned: 'left' },
    ...dailyDays.map(d => ({
      headerName: `${d}일`,
      field: `d${d}`,
      width: 60,
      type: 'numericColumn' as const,
    })),
    { headerName: '합계', field: 'total', width: 80, type: 'numericColumn' as const, cellStyle: { fontWeight: 600 } },
  ], [dailyDays]);

  const dailyTableRows = useMemo(() =>
    dailyData.map(entry => {
      const row: Record<string, string | number> = { lossTypeName: getCodeName(entry.lossTypeCode) };
      let total = 0;
      dailyDays.forEach((d, i) => {
        const val = entry.values[i] ?? 0;
        row[`d${d}`] = val;
        total += val;
      });
      row.total = total;
      return row;
    }), [dailyData, dailyDays, getCodeName]);

  // equip table
  const equipList = useMemo(() => equipRaw?.equipment ?? [], [equipRaw]);
  const equipData = useMemo(() => equipRaw?.data ?? [], [equipRaw]);

  const equipTableCols = useMemo<ColDef[]>(() => [
    { headerName: 'Loss유형', field: 'lossTypeName', width: 120, pinned: 'left' },
    ...equipList.map(eq => ({
      headerName: `${eq.unitNumber}-${eq.lineName}`,
      field: `eq${eq.id}`,
      width: 100,
      type: 'numericColumn' as const,
    })),
    { headerName: '합계', field: 'total', width: 80, type: 'numericColumn' as const, cellStyle: { fontWeight: 600 } },
  ], [equipList]);

  const equipTableRows = useMemo(() =>
    equipData.map(entry => {
      const row: Record<string, string | number> = { lossTypeName: getCodeName(entry.lossTypeCode) };
      let total = 0;
      equipList.forEach((eq, i) => {
        const val = entry.values[i] ?? 0;
        row[`eq${eq.id}`] = val;
        total += val;
      });
      row.total = total;
      return row;
    }), [equipData, equipList, getCodeName]);

  const currentTableCols = activeTab === 'daily' ? dailyTableCols : equipTableCols;
  const currentTableRows = activeTab === 'daily' ? dailyTableRows : equipTableRows;
  const currentLoading = activeTab === 'daily' ? dailyLoading : equipLoading;

  const tabStyle = (tab: string): React.CSSProperties => ({
    padding: '6px 16px', cursor: 'pointer', fontSize: 13, fontWeight: activeTab === tab ? 700 : 400,
    borderBottom: activeTab === tab ? '2px solid #3b82f6' : '2px solid transparent',
    color: activeTab === tab ? '#3b82f6' : 'var(--color-text-secondary)',
    background: 'none', border: 'none', borderBottomStyle: 'solid',
  });

  return (
    <PageFilterShell
      title={t('menu.ET0060')}
      toolbar={
        <>
          <input type="month" value={yearMonth} onChange={e => setYearMonth(e.target.value)}
            style={{ width: 160 }} />
          <select value={equipCategoryCode} onChange={e => setEquipCategoryCode(e.target.value)}
            style={{ width: 140 }}>
            <option value="">전체 설비구분</option>
            {equipCategories.filter(c => c.code !== 'ALL').map(c => (
              <option key={c.code} value={c.code}>{c.codeName}</option>
            ))}
          </select>
          <button className="mes-btn" onClick={handleSearch}>조회</button>
        </>
      }
    >
      <div style={{ display: 'flex', gap: 0, borderBottom: '1px solid var(--color-border)', padding: '0 16px' }}>
        <button style={tabStyle('daily')} onClick={() => setActiveTab('daily')}>일자별</button>
        <button style={tabStyle('equip')} onClick={() => setActiveTab('equip')}>설비별</button>
      </div>

      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden', padding: '8px 0' }}>
        <div style={{ padding: '0 16px' }}>
          <LossStackedBarChart
            xLabels={activeTab === 'daily' ? dailyXLabels : equipXLabels}
            series={activeTab === 'daily' ? dailySeries : equipSeries}
            yAxisLabel="분"
            loading={currentLoading}
            height={300}
          />
        </div>

        <div className="ag-theme-mes" style={{ flex: 1, overflow: 'hidden', margin: '0 16px' }}>
          <AgGridReact
            rowData={currentTableRows}
            columnDefs={currentTableCols}
            defaultColDef={{ resizable: true, sortable: true }}
          />
        </div>
      </div>
    </PageFilterShell>
  );
}
