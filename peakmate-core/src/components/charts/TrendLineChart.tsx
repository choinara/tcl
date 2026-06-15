import type { EChartsOption } from 'echarts';
import { EChartBase } from './EChartBase';

export interface TrendLineChartProps {
  xLabels: string[];
  series: { name: string; data: number[]; color?: string }[];
  yAxisLabel?: string;
  loading?: boolean;
  height?: number;
}

export function TrendLineChart({
  xLabels,
  series,
  yAxisLabel = '분',
  loading,
  height = 200,
}: TrendLineChartProps) {
  const option: EChartsOption = {
    grid: { left: '3%', right: '4%', bottom: '3%', top: '10%', containLabel: true },
    tooltip: { trigger: 'axis' },
    xAxis: { type: 'category', data: xLabels, axisLabel: { fontSize: 10 } },
    yAxis: { type: 'value', name: yAxisLabel, nameTextStyle: { fontSize: 11 } },
    series: series.map(s => ({
      name: s.name,
      type: 'line',
      smooth: true,
      data: s.data,
      lineStyle: { color: s.color ?? '#3b82f6', width: 2 },
      symbol: 'circle',
      symbolSize: 4,
    })),
  };
  return <EChartBase option={option} loading={loading} height={height} />;
}
