import { useState, useCallback, useEffect, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { useQuery } from '@tanstack/react-query';
import { authFetch } from '@/lib/api';
import { usePermission } from '@/hooks/usePermission';
import { PageFilterShell } from '@/components/layout/PageFilterShell';
import { DateRangeFilter } from '@/components/ui/DateRangeFilter';
import { useToast } from '@/shared/components/toast/ToastProvider';
import { useCommonCodes } from '@/hooks/useCommonCodes';
import { EquipBarChart } from '@/components/charts';
import { AllCommunityModule, ModuleRegistry, type ColDef } from 'ag-grid-community';
import { AgGridReact } from 'ag-grid-react';
ModuleRegistry.registerModules([AllCommunityModule]);

interface MtbfResponse {
  equipment: { id: number; unitNumber: string; lineName: string }[];
  mtbfValues: { equipId: number; mtbfMin: number; failCount: number; totalLossMin: number }[];
  ucl: number;
}
interface MtbfSearchParams { startDate: string; endDate: string; equipCategoryCode: string }

export default function EquipMtbfPage() {
  const { t } = useTranslation();
  const perm = usePermission('ET0070');
  void perm;
  const { notify } = useToast();
  const codes = useCommonCodes('EQUIP_CATEGORY');
  const equipCategories = useMemo(() => codes['EQUIP_CATEGORY'] ?? [], [codes]);

  const [startDate, setStartDate] = useState(() => {
    const d = new Date();
    d.setMonth(d.getMonth() - 3);
    return d.toISOString().split('T')[0];
  });
  const [endDate, setEndDate] = useState(() => new Date().toISOString().split('T')[0]);
  const [equipCategoryCode, setEquipCategoryCode] = useState('');
  const [searchParams, setSearchParams] = useState<MtbfSearchParams>({ startDate, endDate, equipCategoryCode });

  const handleSearch = useCallback(() => {
    setSearchParams({ startDate, endDate, equipCategoryCode });
  }, [startDate, endDate, equipCategoryCode]);

  const { data, isFetching, error } = useQuery<MtbfResponse>({
    queryKey: ['et-mtbf', searchParams.startDate, searchParams.endDate, searchParams.equipCategoryCode],
    queryFn: async ({ signal }) => {
      const params = new URLSearchParams({ startDate: searchParams.startDate, endDate: searchParams.endDate });
      if (searchParams.equipCategoryCode) params.set('equipCategoryCode', searchParams.equipCategoryCode);
      const res = await authFetch(`/api/et/loss/analysis/mtbf?${params}`, { signal });
      if (!res.ok) throw new Error('MTBF 분석 조회 실패');
      const json = await res.json();
      return json.data as MtbfResponse;
    },
    refetchOnWindowFocus: false,
  });

  useEffect(() => {
    if (error) notify(t('message.networkError', 'MTBF 분석 조회에 실패했습니다'), { type: 'error' });
  }, [error, notify, t]);

  const chartData = useMemo(() =>
    (data?.equipment ?? []).map((eq, i) => ({
      name: `${eq.unitNumber}-${eq.lineName}`,
      value: data?.mtbfValues[i]?.mtbfMin ?? 0,
    })), [data]);

  const tableColDefs = useMemo<ColDef[]>(() => [
    { headerName: '설비', field: 'equipName', width: 130 },
    { headerName: 'MTBF(분)', field: 'mtbfMin', width: 120, type: 'numericColumn' },
    { headerName: 'UCL(분)', field: 'ucl', width: 100, type: 'numericColumn' },
    { headerName: '고장건수', field: 'failCount', width: 100, type: 'numericColumn' },
    { headerName: '총Loss(분)', field: 'totalLossMin', width: 110, type: 'numericColumn' },
    {
      headerName: '판정', field: 'judgment', width: 80,
      cellStyle: (p) => p.value === 'OK' ? { color: '#22c55e', fontWeight: 600 } : { color: '#ef4444', fontWeight: 600 },
    },
  ], []);

  const ucl = data?.ucl ?? 720;

  const tableRows = useMemo(() =>
    (data?.equipment ?? []).map((eq, i) => {
      const mv = data?.mtbfValues[i];
      const mtbfMin = mv?.mtbfMin ?? 0;
      return {
        equipName: `${eq.unitNumber}-${eq.lineName}`,
        mtbfMin,
        ucl,
        failCount: mv?.failCount ?? 0,
        totalLossMin: mv?.totalLossMin ?? 0,
        judgment: mtbfMin >= ucl ? 'OK' : 'NG',
      };
    }), [data, ucl]);

  return (
    <PageFilterShell
      title={t('menu.ET0070')}
      toolbar={
        <>
          <DateRangeFilter
            dateFrom={startDate}
            dateTo={endDate}
            onDateFromChange={setStartDate}
            onDateToChange={setEndDate}
          />
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
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden', padding: '8px 0' }}>
        <div style={{ padding: '0 16px' }}>
          <EquipBarChart
            data={chartData}
            ucl={ucl}
            uclLabel="UCL"
            yAxisLabel="분"
            loading={isFetching}
            height={300}
          />
        </div>

        <div className="ag-theme-mes" style={{ flex: 1, overflow: 'hidden', margin: '0 16px' }}>
          <AgGridReact
            rowData={tableRows}
            columnDefs={tableColDefs}
            defaultColDef={{ resizable: true, sortable: true }}
          />
        </div>
      </div>
    </PageFilterShell>
  );
}
