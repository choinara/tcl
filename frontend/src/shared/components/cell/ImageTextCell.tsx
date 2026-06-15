import {Box} from '@mui/material';
import {useCallback} from 'react';

interface ImageTextCellProps {
    /** 이미지 경로 */
    imagePath?: string | null;
    /** 표시할 텍스트/라벨 */
    text: string;
    /** alt 텍스트 */
    alt?: string;
    /** 이미지 타입 */
    imageType: string;
    /** 이미지 너비 (기본값: 45) */
    width?: number;
    /** 이미지 높이 (기본값: 45) */
    height?: number;
    /** 간격 (기본값: 1) */
    gap?: number;
    /** 추가 sx 스타일 */
    sx?: any;
}

const DEFAULT_IMAGES: Record<string, string> = {
    'DEFAULT': '',
};

export const ImageTextCell = ({
    imagePath,
    text,
    alt = text,
    imageType,
    width = 45,
    height = 45,
    gap = 1,
    sx,
}: ImageTextCellProps) => {
    const getImageUrl = useCallback((path: string | null | undefined, type: string): string => {
        if (path && typeof path === 'string' && path.trim()) {
            return path;
        }
        return DEFAULT_IMAGES[type] || DEFAULT_IMAGES['DEFAULT'] || '';
    }, []);

    const handleImageError = useCallback((e: React.SyntheticEvent<HTMLImageElement>) => {
        const img = e.currentTarget;
        img.style.display = 'none';
    }, []);

    const imageUrl = getImageUrl(imagePath, imageType);

    return (
        <Box sx={{
            display: 'flex',
            alignItems: 'center',
            gap,
            ...sx,
        }}>
            {imageUrl && (
                <img
                    src={imageUrl}
                    alt={alt}
                    data-image-type={imageType}
                    style={{
                        width,
                        height,
                        objectFit: 'cover',
                        borderRadius: '4px',
                        flexShrink: 0,
                    }}
                    onError={handleImageError}
                />
            )}
            <span>{text}</span>
        </Box>
    );
};

export default ImageTextCell;
