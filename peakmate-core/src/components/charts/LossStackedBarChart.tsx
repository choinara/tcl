import type { EChartsOption } from 'echarts';
import { EChartBase } from './EChartBase';

const CHART_COLORS = [
  '#3b82f6', '#ef4444', '#f59e0b', '#22c55e',
  '#8b5cf6', '#ec4899', '#06b6d4', '#64748b',
];

export interface LossStackedBarChartProps {
  xLabels: string[];
  series: { name: string; data: number[] }[];
  yAxisLabel?: string;
  loading?: boolean;
  height?: number;
}

export function LossStackedBarChart({
  xLabels,
  series,
  yAxisLabel = '분',
  loading,
  height = 300,
}: LossStackedBarChartProps) {
  const option: EChartsOption = {
    tooltip: { trigger: 'axis', axisPointer: { type: 'shadow' } },
    legend: { data: series.map(s => s.name), textStyle: { fontSize: 12 } },
    grid: { left: '3%', right: '4%', bottom: '3%', containLabel: true },
    xAxis: {
      type: 'category',
      data: xLabels,
      axisLabel: { fontSize: 11, rotate: xLabels.length > 20 ? 30 : 0 },
    },
    yAxis: { type: 'value', name: yAxisLabel },
    series: series.map((s, i) => ({
      name: s.name,
      type: 'bar',
      stack: 'total',
      data: s.data,
      itemStyle: { color: CHART_COLORS[i % CHART_COLORS.length] },
    })),
  };
  return <EChartBase option={option} loading={loading} height={height} />;
}
