import {Box} from '@mui/material';
import type {BadgeStyleConfig} from '@/shared/constants/badgeStyles/default';
import {productionStatusStyles} from '@/shared/constants/badgeStyles/default';

interface StatusChipProps {
  status: string;
  px?: number|string;
  py?: number|string;
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
  if (!style) {
    const fallback = styleConfig['Disable'] || Object.values(styleConfig)[0];
    if (!fallback) {
      console.warn(`StatusChip: No style found for status "${status}"`);
      return <Box sx={{ display: 'inline-block' }}>{status}</Box>;
    }
    const bgColor = fallback.bgColor || '#F2F3F4';
    const color = fallback.textColor || '#717D7E';
    const borderColor = fallback.borderColor;

    return (
      <Box
        sx={{
          display: 'inline-block',
          px,
          py,
          borderRadius: '13px',
          fontSize,
          fontWeight,
          bgcolor: bgColor,
          color,
          border: withBorder && borderColor ? `1px solid ${borderColor}` : 'none',
          whiteSpace: 'nowrap',
        }}
      >
        {status}
      </Box>
    );
  }

  const { bgColor, textColor, borderColor } = style;

  return (
    <Box
      sx={{
        display: 'inline-block',
        px,
        py,
        borderRadius: '13px',
        fontSize,
        fontWeight,
        bgcolor: bgColor,
        color: textColor,
        border: withBorder ? `1px solid ${borderColor}` : 'none',
        whiteSpace: 'nowrap',
      }}
    >
      {status}
    </Box>
  );
};

export default StatusChip;
