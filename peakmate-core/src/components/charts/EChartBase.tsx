import ReactECharts from 'echarts-for-react';
import type { EChartsOption } from 'echarts';
import type { CSSProperties } from 'react';

interface EChartBaseProps {
  option: EChartsOption;
  height?: number | string;
  loading?: boolean;
  style?: CSSProperties;
}

export function EChartBase({ option, height = 300, loading = false, style }: EChartBaseProps) {
  return (
    <ReactECharts
      option={option}
      notMerge={true}
      lazyUpdate={false}
      showLoading={loading}
      style={{ height: typeof height === 'number' ? `${height}px` : height, ...style }}
    />
  );
}
