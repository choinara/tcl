import { FileText, Music, Film, FileSpreadsheet, File } from 'lucide-react';
import type { FileType } from './types';

/**
 * 파일 타입별 아이콘 매핑 (Lucide)
 */
export const FILE_TYPE_ICONS: Record<FileType, React.ComponentType<{ size?: number | string }>> = {
  pdf: FileText,
  musx: Music,
  mp4: Film,
  mp3: Music,
  doc: FileSpreadsheet,
  default: File,
};

/**
 * 파일 타입별 아이콘 색상
 */
export const FILE_TYPE_ICON_COLORS: Record<FileType, string> = {
  pdf: '#4CAF50',
  musx: '#FF9800',
  mp4: '#9C27B0',
  mp3: '#E91E63',
  doc: '#2196F3',
  default: '#757575',
};

/**
 * 파일 아이콘 크기
 */
export const FILE_ICON_SIZE = 32;

/**
 * 업로드 카드 높이
 */
export const UPLOAD_CARD_MIN_HEIGHT = 80;
