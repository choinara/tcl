
interface DataPoint {
    label: string;
    value: number;
}

interface PremiumChartProps {
    data: DataPoint[];
    height?: number;
    color?: string;
    showArea?: boolean;
}

export function PremiumChart({ data, height = 100, color = '#3b82f6', showArea = true }: PremiumChartProps) {
    if (!data || data.length === 0) return null;

    const max = Math.max(...data.map(d => d.value), 1);
    const padding = 10;
    const width = 300; // Fixed width for simplicity in this minimal version

    const points = data.map((d, i) => ({
        x: (i / (data.length - 1)) * (width - padding * 2) + padding,
        y: height - (d.value / max) * (height - padding * 2) - padding
    }));

    const pathData = `M ${points.map(p => `${p.x},${p.y}`).join(' L ')}`;
    const areaData = `${pathData} L ${points[points.length - 1].x},${height} L ${points[0].x},${height} Z`;

    return (
        <div style={{ width: '100%', height, position: 'relative', overflow: 'hidden' }}>
            <svg width="100%" height={height} viewBox={`0 0 ${width} ${height}`} preserveAspectRatio="none">
                <defs>
                    <linearGradient id="chartGradient" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor={color} stopOpacity="0.4" />
                        <stop offset="100%" stopColor={color} stopOpacity="0" />
                    </linearGradient>
                </defs>

                {showArea && (
                    <path
                        d={areaData}
                        fill="url(#chartGradient)"
                        style={{ transition: 'all 0.5s ease' }}
                    />
                )}

                <path
                    d={pathData}
                    fill="none"
                    stroke={color}
                    strokeWidth="3"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    style={{ transition: 'all 0.5s ease' }}
                />

                {/* Highlight last point */}
                <circle
                    cx={points[points.length - 1].x}
                    cy={points[points.length - 1].y}
                    r="4"
                    fill="white"
                    stroke={color}
                    strokeWidth="2"
                />
            </svg>
        </div>
    );
}
