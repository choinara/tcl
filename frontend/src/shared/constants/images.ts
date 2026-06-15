/**
 * 각 도메인의 기본 이미지 경로
 */
export const DEFAULT_IMAGES = {
  ARTIST: '',
  ALBUM: '',
  OST: '',
} as const;

/**
 * 이미지 URL 유효성 검사 및 기본값 반환
 * @param imagePath - 확인할 이미지 경로
 * @param domainType - 도메인 유형 ('ARTIST', 'ALBUM', 'OST')
 * @returns 유효한 이미지 경로 또는 기본 이미지 경로
 */
export const getImageUrl = (
  imagePath: string | null | undefined,
  domainType: keyof typeof DEFAULT_IMAGES = 'ALBUM'
): string => {
  if (imagePath && imagePath.trim() !== '') {
    return imagePath;
  }
  return DEFAULT_IMAGES[domainType];
};

/**
 * 이미지 로드 실패 시 기본 이미지로 대체하는 핸들러
 * @param event - 이미지 요소의 이벤트
 * @param domainType - 도메인 유형
 */
export const handleImageError = (
  event: React.SyntheticEvent<HTMLImageElement>,
  domainType: keyof typeof DEFAULT_IMAGES = 'ALBUM'
) => {
  const img = event.currentTarget;
  img.src = DEFAULT_IMAGES[domainType];
};
