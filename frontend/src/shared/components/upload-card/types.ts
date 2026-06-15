/**
 * 파일 타입
 */
export type FileType = 'pdf' | 'musx' | 'mp4' | 'mp3' | 'doc' | 'default';

/**
 * 업로드 카드 액션 버튼 설정
 */
export interface UploadCardAction {
  label: string;
  onClick: () => void;
  icon?: React.ReactNode;
  variant?: 'primary' | 'gray' | 'ghost';
  disabled?: boolean;
}

/**
 * 업로드 카드 Props
 */
export interface UploadCardProps {
  /** 파일 타입 (아이콘 및 색상 결정) */
  fileType: FileType;
  /** 파일명 */
  fileName: string;
  /** 파일 크기 (예: "2.3MB") */
  fileSize: string;
  /** 업로드 날짜 (예: "2026.02.27") */
  uploadDate: string;
  /** 액션 버튼 목록 */
  actions: UploadCardAction[];
  /** 추가 CSS 클래스 */
  className?: string;
  /** 인라인 스타일 */
  style?: React.CSSProperties;
}
