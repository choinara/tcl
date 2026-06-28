import { useCallback } from 'react';

interface ImageTextCellProps {
  imagePath?: string | null;
  text: string;
  alt?: string;
  imageType: string;
  width?: number;
  height?: number;
  gap?: number;
  sx?: React.CSSProperties;
}

const DEFAULT_IMAGES: Record<string, string> = {
  DEFAULT: '',
};

export const ImageTextCell = ({
  imagePath,
  text,
  alt = text,
  imageType,
  width = 45,
  height = 45,
  gap = 4,
  sx,
}: ImageTextCellProps) => {
  const getImageUrl = useCallback((path: string | null | undefined, type: string): string => {
    if (path && typeof path === 'string' && path.trim()) return path;
    return DEFAULT_IMAGES[type] || DEFAULT_IMAGES['DEFAULT'] || '';
  }, []);

  const handleImageError = useCallback((e: React.SyntheticEvent<HTMLImageElement>) => {
    e.currentTarget.style.display = 'none';
  }, []);

  const imageUrl = getImageUrl(imagePath, imageType);

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap, ...sx }}>
      {imageUrl && (
        <img
          src={imageUrl}
          alt={alt}
          data-image-type={imageType}
          style={{ width, height, objectFit: 'cover', borderRadius: 4, flexShrink: 0 }}
          onError={handleImageError}
        />
      )}
      <span>{text}</span>
    </div>
  );
};

export default ImageTextCell;
