import type { BadgeStyleConfig } from '@/shared/constants/badgeStyles/default';
import { productionStatusStyles } from '@/shared/constants/badgeStyles/default';

interface StatusChipProps {
  status: string;
  px?: number | string;
  py?: number | string;
  fontSize?: string | number;
  fontWeight?: number;
  styleConfig?: BadgeStyleConfig;
  withBorder?: boolean;
}

export const StatusChip = ({
  status,
  px = 1,
  py = '3px',
  fontSize = '13px',
  fontWeight = 500,
  styleConfig = productionStatusStyles,
  withBorder = false,
}: StatusChipProps) => {
  const style = styleConfig[status];
  const pxVal = typeof px === 'number' ? `${px * 4}px` : px;
  const pyVal = typeof py === 'number' ? `${py * 4}px` : py;

  if (!style) {
    const fallback = styleConfig['Disable'] || Object.values(styleConfig)[0];
    if (!fallback) {
      console.warn(`StatusChip: No style found for status "${status}"`);
      return <div style={{ display: 'inline-block' }}>{status}</div>;
    }
    const bgColor = fallback.bgColor || '#F2F3F4';
    const color = fallback.textColor || '#717D7E';
    const borderColor = fallback.borderColor;

    return (
      <div
        style={{
          display: 'inline-block',
          padding: `${pyVal} ${pxVal}`,
          borderRadius: '13px',
          fontSize,
          fontWeight,
          backgroundColor: bgColor,
          color,
          border: withBorder && borderColor ? `1px solid ${borderColor}` : 'none',
          whiteSpace: 'nowrap',
        }}
      >
        {status}
      </div>
    );
  }

  const { bgColor, textColor, borderColor } = style;

  return (
    <div
      style={{
        display: 'inline-block',
        padding: `${pyVal} ${pxVal}`,
        borderRadius: '13px',
        fontSize,
        fontWeight,
        backgroundColor: bgColor,
        color: textColor,
        border: withBorder ? `1px solid ${borderColor}` : 'none',
        whiteSpace: 'nowrap',
      }}
    >
      {status}
    </div>
  );
};

export default StatusChip;
