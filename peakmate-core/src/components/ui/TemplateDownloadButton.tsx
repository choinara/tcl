import { useState } from 'react';
import { authFetch } from '../../lib/api';
import { coreNotify } from '../../stores/useNotifyStore';

interface TemplateDownloadButtonProps {
  /** 서버에서 템플릿 파일을 반환하는 URL */
  templateUrl: string;
  /** 저장될 파일명 (기본값: template.xlsx) */
  fileName?: string;
  label?: string;
  disabled?: boolean;
}

export function TemplateDownloadButton({
  templateUrl,
  fileName = 'template.xlsx',
  label = '템플릿 다운로드',
  disabled,
}: TemplateDownloadButtonProps) {
  const [downloading, setDownloading] = useState(false);

  const handleClick = async () => {
    setDownloading(true);
    try {
      const res = await authFetch(templateUrl);

      if (!res.ok) {
        coreNotify('템플릿 다운로드에 실패했습니다', { type: 'error' });
        return;
      }

      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = fileName;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch {
      coreNotify('템플릿 다운로드 중 오류가 발생했습니다', { type: 'error' });
    } finally {
      setDownloading(false);
    }
  };

  return (
    <button
      type="button"
      onClick={handleClick}
      disabled={disabled || downloading}
      className="mes-btn"
    >
      {downloading ? '다운로드 중...' : label}
    </button>
  );
}
