import { EChartBase } from '@/components/charts';
import { Card, CardHeader, CardTitle, CardContent } from '../components/shadcn/card';
import { Badge } from '../components/shadcn/badge';
import type { EChartsOption } from 'echarts';

const xLabels = ['1월', '2월', '3월', '4월', '5월', '6월'];
const monthlyChartOption: EChartsOption = {
  tooltip: { trigger: 'axis', axisPointer: { type: 'shadow' } },
  legend: { data: ['사용자', '세션', '알림'], textStyle: { fontSize: 11, color: '#6b6862' } },
  grid: { left: '3%', right: '4%', bottom: '3%', containLabel: true },
  xAxis: {
    type: 'category',
    data: xLabels,
    axisLine: { lineStyle: { color: '#ddd8d0' } },
    axisTick: { show: false },
    axisLabel: { fontSize: 12, color: '#8a8580' },
  },
  yAxis: { type: 'value', axisLine: { show: false }, axisTick: { show: false }, axisLabel: { fontSize: 12, color: '#8a8580' } },
  series: [
    { name: '사용자', type: 'bar', data: [120, 135, 148, 162, 170, 185], itemStyle: { color: '#7c6fae', borderRadius: [4, 4, 0, 0] } },
    { name: '세션',   type: 'bar', data: [340, 380, 420, 460, 510, 540], itemStyle: { color: '#5b8ab5', borderRadius: [4, 4, 0, 0] } },
    { name: '알림',   type: 'bar', data: [45, 52, 38, 61, 55, 48],       itemStyle: { color: '#d4a054', borderRadius: [4, 4, 0, 0] } },
  ],
};

type BadgeVariant = 'default' | 'secondary' | 'destructive' | 'outline' | 'success' | 'warning';

const kpiItems: { label: string; value: string; unit: string; badge: string; badgeVariant: BadgeVariant; sub: string }[] = [
  { label: '총 사용자',   value: '185', unit: '명', badge: '+5명',  badgeVariant: 'success',   sub: '이번 달 신규' },
  { label: '활성 세션',   value: '42',  unit: '건', badge: '실시간', badgeVariant: 'default',  sub: '현재 접속 중' },
  { label: '알림',        value: '12',  unit: '건', badge: '미확인', badgeVariant: 'warning',  sub: '처리 대기 중' },
  { label: '시스템 상태', value: 'Good', unit: '',  badge: '정상',  badgeVariant: 'success',   sub: '전체 서비스 운영 중' },
];

function Dashboard() {
  return (
    <div className="p-6 bg-gray-50 min-h-screen">
      {/* Header */}
      <div
        className="mb-6 rounded-xl p-6 text-white"
        style={{ background: 'linear-gradient(135deg, #4a4168 0%, #6b5e8a 40%, #8a7db0 100%)', boxShadow: '0 4px 20px rgba(74,65,104,0.2)' }}
      >
        <h2 className="text-xl font-bold mb-1">Dashboard</h2>
        <p className="text-white/75 text-sm">PeakMate System — 현황 요약</p>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-4 gap-4 mb-6">
        {kpiItems.map((item) => (
          <Card key={item.label}>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-gray-500">{item.label}</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-gray-900 mb-2">
                {item.value}
                {item.unit && <span className="text-base font-normal text-gray-400 ml-1">{item.unit}</span>}
              </div>
              <div className="flex items-center gap-2 flex-wrap">
                <Badge variant={item.badgeVariant}>{item.badge}</Badge>
                <span className="text-xs text-gray-400">{item.sub}</span>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Chart */}
      <Card>
        <CardHeader>
          <CardTitle className="text-sm font-semibold text-gray-700">월별 현황</CardTitle>
        </CardHeader>
        <CardContent className="pt-0">
          <EChartBase option={monthlyChartOption} height={300} />
        </CardContent>
      </Card>
    </div>
  );
}

export default Dashboard;
