import { useState, useRef, useCallback } from 'react';

interface ImageUploadProps {
  onFileSelect: (file: File) => void;
  loading?: boolean;
  accept?: string;
}

export function ImageUpload({ onFileSelect, loading = false, accept = 'image/*' }: ImageUploadProps) {
  const [preview, setPreview] = useState<string | null>(null);
  const [dragOver, setDragOver] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleFile = useCallback((file: File) => {
    const url = URL.createObjectURL(file);
    setPreview(url);
    onFileSelect(file);
  }, [onFileSelect]);

  const handleChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) handleFile(file);
  }, [handleFile]);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    const file = e.dataTransfer.files?.[0];
    if (file && file.type.startsWith('image/')) handleFile(file);
  }, [handleFile]);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(true);
  }, []);

  const handleDragLeave = useCallback(() => setDragOver(false), []);

  return (
    <div style={{ position: 'relative' }}>
      <div
        onClick={() => !loading && inputRef.current?.click()}
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        style={{
          border: `2px dashed ${dragOver ? '#3b82f6' : '#d1d5db'}`,
          borderRadius: 8,
          padding: preview ? 0 : 40,
          textAlign: 'center',
          cursor: loading ? 'default' : 'pointer',
          backgroundColor: dragOver ? '#eff6ff' : '#fafafa',
          transition: 'all 0.2s',
          minHeight: 200,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          overflow: 'hidden',
        }}
      >
        {preview ? (
          <img
            src={preview}
            alt="Preview"
            style={{ maxWidth: '100%', maxHeight: 400, objectFit: 'contain' }}
          />
        ) : (
          <div style={{ color: '#9ca3af' }}>
            <div style={{ fontSize: 36, marginBottom: 8 }}>&#128247;</div>
            <div style={{ fontSize: 'var(--font-size-md)', fontWeight: 500 }}>
              클릭하여 이미지 선택 또는 드래그 앤 드롭
            </div>
            <div style={{ fontSize: 'var(--font-size-sm)', marginTop: 4 }}>
              JPG, PNG, WebP, GIF (최대 50MB)
            </div>
          </div>
        )}
      </div>

      {loading && (
        <div style={{
          position: 'absolute',
          inset: 0,
          backgroundColor: 'rgba(255,255,255,0.85)',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          borderRadius: 8,
          gap: 12,
        }}>
          <div className="mes-spinner" style={{
            width: 36, height: 36, border: '3px solid #e2e8f0',
            borderTopColor: '#3b82f6', borderRadius: '50%',
            animation: 'spin 0.8s linear infinite',
          }} />
          <div style={{ fontSize: 'var(--font-size-md)', color: '#475569', fontWeight: 500 }}>
            OCR 처리 중...
          </div>
        </div>
      )}

      <input
        ref={inputRef}
        type="file"
        accept={accept}
        capture="environment"
        onChange={handleChange}
        style={{ display: 'none' }}
      />

      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
      `}</style>
    </div>
  );
}
