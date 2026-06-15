import { useState, useEffect, useMemo, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { useQuery } from '@tanstack/react-query';
import { authFetch } from '@/lib/api';
import { usePermission } from '@/hooks/usePermission';
import { PageFilterShell } from '@/components/layout/PageFilterShell';
import { useToast } from '@/shared/components/toast/ToastProvider';
import { useCommonCodes } from '@/hooks/useCommonCodes';
import { GaugeChart } from '@/components/charts';

interface DashboardSummary {
  totalEquip: number;
  runningCount: number;
  faultCount: number;
  idleCount: number;
  avgOee: number;
  totalLossToday: number;
  failCountThisMonth: number;
  simulationMode: boolean;
}

interface EquipStatusItem {
  equipId: number;
  unitNumber: string;
  lineName: string;
  status: 'RUNNING' | 'FAULT' | 'IDLE';
  oeePercent: number;
  todayLossMin: number;
  failCountToday: number;
}

interface DashboardData {
  summary: DashboardSummary;
  equipStatus: EquipStatusItem[];
}

const STATUS_COLOR: Record<string, string> = {
  RUNNING: '#22c55e',
  FAULT:   '#ef4444',
  IDLE:    '#f59e0b',
};

type TFunction = (key: string) => string;

function KpiCard({ label, value, unit, color }: { label: string; value: number; unit: string; color?: string }) {
  return (
    <div style={{
      background: 'var(--color-surface)',
      border: '1px solid var(--color-border)',
      borderRadius: 8,
      padding: '10px 16px',
      minWidth: 100,
    }}>
      <div style={{ fontSize: 11, color: 'var(--color-text-secondary)' }}>{label}</div>
      <div style={{ fontSize: 22, fontWeight: 700, color: color ?? 'var(--color-text-primary)' }}>
        {value}<span style={{ fontSize: 12, fontWeight: 400, marginLeft: 2 }}>{unit}</span>
      </div>
    </div>
  );
}

function EquipStatusCard({ equip, t }: { equip: EquipStatusItem; t: TFunction }) {
  const statusLabel: Record<string, string> = {
    RUNNING: t('page.equipDashboard.statusRunning'),
    FAULT:   t('page.equipDashboard.statusFault'),
    IDLE:    t('page.equipDashboard.statusIdle'),
  };
  return (
    <div style={{
      background: 'var(--color-surface)',
      border: `1px solid ${STATUS_COLOR[equip.status] ?? '#e5e7eb'}`,
      borderRadius: 8,
      padding: 12,
    }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
        <span style={{ fontSize: 13, fontWeight: 600 }}>{equip.unitNumber}</span>
        <span style={{
          fontSize: 11,
          background: STATUS_COLOR[equip.status] ?? '#6b7280',
          color: '#fff',
          borderRadius: 4,
          padding: '2px 6px',
        }}>
          {statusLabel[equip.status] ?? equip.status}
        </span>
      </div>
      <div style={{ fontSize: 11, color: 'var(--color-text-secondary)', marginBottom: 8 }}>{equip.lineName}</div>
      <GaugeChart value={equip.oeePercent} label="OEE" unit="%" height={120} />
      <div style={{ fontSize: 11, marginTop: 4 }}>
        {t('page.equipDashboard.todayLoss')}: <strong>{equip.todayLossMin}분</strong>
        {' / '}
        {t('page.equipDashboard.failCount')}: <strong>{equip.failCountToday}건</strong>
      </div>
    </div>
  );
}

export default function EquipDashboardPage() {
  const { t } = useTranslation();
  const perm = usePermission('ET0120');
  void perm;
  const { notify } = useToast();
  const codes = useCommonCodes('EQUIP_CATEGORY');
  const equipCategories = useMemo(() => codes['EQUIP_CATEGORY'] ?? [], [codes]);

  const [equipCategoryCode, setEquipCategoryCode] = useState('');
  const [queryCategory, setQueryCategory] = useState('');
  const errorNotifiedRef = useRef(false);

  const { data, isFetching, dataUpdatedAt, error } = useQuery<DashboardData>({
    queryKey: ['et-dashboard', queryCategory],
    queryFn: async ({ signal }) => {
      const params = new URLSearchParams();
      if (queryCategory) params.set('equipCategoryCode', queryCategory);
      const url = `/api/et/monitor/dashboard${params.toString() ? `?${params}` : ''}`;
      const res = await authFetch(url, { signal });
      if (!res.ok) throw new Error('dashboard fetch failed');
      const json = await res.json();
      return json.data as DashboardData;
    },
    refetchInterval: 30_000,
    refetchOnWindowFocus: true,
    staleTime: 25_000,
  });

  // 첫 오류만 토스트, 복구 시 초기화 (toast dedup for 30s polling)
  useEffect(() => {
    if (error && !errorNotifiedRef.current) {
      errorNotifiedRef.current = true;
      notify(t('message.networkError'), { type: 'error' });
    }
    if (!error) errorNotifiedRef.current = false;
  }, [error, notify, t]);

  return (
    <PageFilterShell
      title={t('menu.ET0120')}
      toolbar={
        <>
          <select
            value={equipCategoryCode}
            onChange={e => setEquipCategoryCode(e.target.value)}
            style={{ width: 140 }}
          >
            <option value="">{t('page.equipDashboard.allCategory')}</option>
            {equipCategories.filter(c => c.code !== 'ALL').map(c => (
              <option key={c.code} value={c.code}>{c.codeName}</option>
            ))}
          </select>
          <button className="mes-btn" onClick={() => setQueryCategory(equipCategoryCode)}>
            {t('page.equipDashboard.search')}
          </button>
          {isFetching && (
            <span style={{ fontSize: 12, color: 'var(--color-text-secondary)' }}>
              {t('page.equipDashboard.updating')}
            </span>
          )}
        </>
      }
    >
      {/* 시뮬레이션 안내 배지 */}
      {data?.summary.simulationMode && (
        <div style={{ padding: '4px 16px', background: '#fef3c7', fontSize: 12, color: '#92400e' }}>
          {t('page.equipDashboard.simulationNotice')}
        </div>
      )}

      {/* KPI 요약 카드 행 */}
      <div style={{ display: 'flex', gap: 12, padding: '12px 16px', flexWrap: 'wrap' }}>
        <KpiCard label={t('page.equipDashboard.kpiTotalEquip')} value={data?.summary.totalEquip ?? 0} unit="대" />
        <KpiCard label={t('page.equipDashboard.kpiRunning')} value={data?.summary.runningCount ?? 0} unit="대" color="#22c55e" />
        <KpiCard label={t('page.equipDashboard.kpiFault')} value={data?.summary.faultCount ?? 0} unit="대" color="#ef4444" />
        <KpiCard label={t('page.equipDashboard.kpiIdle')} value={data?.summary.idleCount ?? 0} unit="대" color="#f59e0b" />
        <KpiCard label={t('page.equipDashboard.kpiAvgOee')} value={data?.summary.avgOee ?? 0} unit="%" />
        <KpiCard label={t('page.equipDashboard.kpiTodayLoss')} value={data?.summary.totalLossToday ?? 0} unit="분" />
        <KpiCard label={t('page.equipDashboard.kpiMonthFail')} value={data?.summary.failCountThisMonth ?? 0} unit="건" />
      </div>

      {/* 설비 상태 카드 그리드 */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))',
        gap: 12,
        padding: '0 16px 16px',
        overflowY: 'auto',
        flex: 1,
      }}>
        {(data?.equipStatus ?? []).map(equip => (
          <EquipStatusCard key={equip.equipId} equip={equip} t={t} />
        ))}
      </div>

      {/* 마지막 갱신 시각 */}
      <div style={{ padding: '0 16px 8px', fontSize: 11, color: 'var(--color-text-secondary)' }}>
        {t('page.equipDashboard.lastUpdated')}: {dataUpdatedAt ? new Date(dataUpdatedAt).toLocaleTimeString() : '-'}
        {' / '}
        {t('page.equipDashboard.autoRefresh')}
      </div>
    </PageFilterShell>
  );
}
