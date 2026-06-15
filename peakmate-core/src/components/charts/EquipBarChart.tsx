import type { EChartsOption } from 'echarts';
import { EChartBase } from './EChartBase';

export interface EquipBarData {
  name: string;
  value: number;
}

export interface EquipBarChartProps {
  data: EquipBarData[];
  ucl?: number;
  uclLabel?: string;
  yAxisLabel?: string;
  barColor?: string;
  loading?: boolean;
  height?: number;
}

export function EquipBarChart({
  data,
  ucl,
  uclLabel = 'UCL',
  yAxisLabel = '분',
  barColor = '#3b82f6',
  loading,
  height = 300,
}: EquipBarChartProps) {
  const option: EChartsOption = {
    grid: { left: '3%', right: '8%', bottom: '3%', containLabel: true },
    tooltip: {
      trigger: 'axis',
      formatter: (params: unknown) => {
        const p = (params as { name: string; value: number }[])[0];
        return `${p.name}<br/>${p.value} ${yAxisLabel}`;
      },
    },
    xAxis: {
      type: 'category',
      data: data.map(d => d.name),
      axisLabel: { fontSize: 11, rotate: data.length > 10 ? 30 : 0 },
    },
    yAxis: { type: 'value', name: yAxisLabel, nameTextStyle: { fontSize: 12 } },
    series: [
      {
        type: 'bar',
        data: data.map(d => d.value),
        itemStyle: { color: barColor },
        // 조건부 spread: markLine: undefined 명시 대신 키 자체를 생략
        ...(ucl != null && {
          markLine: {
            silent: true,
            symbol: 'none',
            lineStyle: { color: '#ef4444', type: 'dashed', width: 2 },
            data: [{ yAxis: ucl, name: `${uclLabel}: ${ucl}` }],
            label: { formatter: '{b}', position: 'end', color: '#ef4444', fontSize: 11 },
          },
        }),
      },
    ],
  };
  return <EChartBase option={option} loading={loading} height={height} />;
}
