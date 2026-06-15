import { useState } from 'react';
import { authFetch } from '../../lib/api';
import { coreNotify } from '../../stores/useNotifyStore';

interface ExcelUploadButtonProps {
  /** multipart/form-data POST를 받는 서버 URL */
  uploadUrl: string;
  onSuccess?: (data: unknown) => void;
  onError?: (message: string) => void;
  label?: string;
  disabled?: boolean;
}

export function ExcelUploadButton({
  uploadUrl,
  onSuccess,
  onError,
  label = '엑셀 업로드',
  disabled,
}: ExcelUploadButtonProps) {
  const [uploading, setUploading] = useState(false);

  const handleClick = () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.xlsx,.xls';
    input.onchange = async (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (!file) return;

      setUploading(true);
      try {
        const formData = new FormData();
        formData.append('file', file);

        const res = await authFetch(uploadUrl, { method: 'POST', body: formData });

        if (!res.ok) {
          const err = await res.json().catch(() => ({ message: '서버 응답을 처리할 수 없습니다' }));
          const msg: string = err?.message || '업로드에 실패했습니다';
          coreNotify(msg, { type: 'error' });
          onError?.(msg);
          return;
        }

        const data = await res.json().catch(() => null);
        coreNotify('엑셀 업로드가 완료되었습니다', { type: 'success' });
        onSuccess?.(data);
      } catch {
        const msg = '업로드 중 오류가 발생했습니다';
        coreNotify(msg, { type: 'error' });
        onError?.(msg);
      } finally {
        setUploading(false);
      }
    };
    input.click();
  };

  return (
    <button
      type="button"
      onClick={handleClick}
      disabled={disabled || uploading}
      className="mes-btn"
    >
      {uploading ? '업로드 중...' : label}
    </button>
  );
}
