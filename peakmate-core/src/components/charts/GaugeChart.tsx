import type { EChartsOption } from 'echarts';
import { EChartBase } from './EChartBase';

export interface GaugeChartProps {
  value: number;
  max?: number;
  label?: string;
  unit?: string;
  loading?: boolean;
  height?: number;
}

export function GaugeChart({ value, max = 100, label = '', unit = '%', loading, height = 140 }: GaugeChartProps) {
  const clampedValue = Math.min(max, Math.max(0, value));
  const ratio = max > 0 ? clampedValue / max : 0;
  const color = ratio >= 0.8 ? '#22c55e' : ratio >= 0.6 ? '#f59e0b' : '#ef4444';

  const option: EChartsOption = {
    series: [
      {
        type: 'gauge',
        min: 0,
        max,
        radius: '90%',
        startAngle: 200,
        endAngle: -20,
        axisLine: {
          lineStyle: {
            width: 12,
            color: [
              [ratio, color],
              [1, '#e5e7eb'],
            ],
          },
        },
        axisTick: { show: false },
        splitLine: { show: false },
        axisLabel: { show: false },
        pointer: { show: false },
        detail: {
          valueAnimation: true,
          formatter: `{value}${unit}`,
          fontSize: 14,
          fontWeight: 600,
          color,
          offsetCenter: [0, '10%'],
        },
        title: { fontSize: 11, color: '#6b7280', offsetCenter: [0, '60%'] },
        data: [{ value: clampedValue, name: label }],
      },
    ],
  };
  return <EChartBase option={option} loading={loading} height={height} />;
}
