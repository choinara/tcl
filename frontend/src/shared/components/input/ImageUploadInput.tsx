import React, { useRef, useState } from 'react';
import { Upload, X } from 'lucide-react';

export interface ImageUploadInputProps {
  onImagesSelected: (files: File[]) => void;
  maxSize?: number;
  multiple?: boolean;
  height?: string | number;
  previewSize?: string | number;
  label?: string | string[];
  className?: string;
  style?: React.CSSProperties;
}

interface ImagePreview {
  file: File;
  preview: string;
}

const formatFileSize = (bytes: number): string => {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + ' ' + sizes[i];
};

export const ImageUploadInput: React.FC<ImageUploadInputProps> = ({
  onImagesSelected,
  maxSize = 10 * 1024 * 1024,
  multiple = true,
  height = '150px',
  previewSize = '150px',
  label = '이미지를 드래그하거나 클릭하여 선택하세요',
  className,
  style,
}) => {
  const [isDragActive, setIsDragActive] = useState(false);
  const [imagePreviews, setImagePreviews] = useState<ImagePreview[]>([]);
  const [error, setError] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const processFiles = (files: FileList | null) => {
    if (!files || files.length === 0) return;
    setError('');
    const newPreviews: ImagePreview[] = [];
    let processedCount = 0;

    Array.from(files).forEach((file) => {
      if (!file.type.startsWith('image/')) { setError('이미지 파일만 업로드 가능합니다'); processedCount++; return; }
      if (file.size > maxSize) { setError(`파일 크기가 ${formatFileSize(maxSize)}를 초과했습니다`); processedCount++; return; }

      const reader = new FileReader();
      reader.onload = (e) => {
        newPreviews.push({ file, preview: e.target?.result as string });
        processedCount++;
        if (processedCount === files.length) {
          const all = multiple ? [...imagePreviews, ...newPreviews] : newPreviews;
          setImagePreviews(all);
          onImagesSelected(all.map((p) => p.file));
        }
      };
      reader.readAsDataURL(file);
    });
  };

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault(); e.stopPropagation();
    setIsDragActive(e.type === 'dragenter' || e.type === 'dragover');
  };

  const handleDrop = (e: React.DragEvent) => { e.preventDefault(); e.stopPropagation(); setIsDragActive(false); processFiles(e.dataTransfer.files); };
  const handleRemoveImage = (index: number) => {
    const next = imagePreviews.filter((_, i) => i !== index);
    setImagePreviews(next);
    onImagesSelected(next.map((p) => p.file));
  };

  return (
    <div className={`w-full ${className ?? ''}`} style={style}>
      <div
        onDragEnter={handleDrag} onDragLeave={handleDrag} onDragOver={handleDrag} onDrop={handleDrop}
        onClick={() => fileInputRef.current?.click()}
        className={`flex flex-col items-center justify-center border rounded-lg cursor-pointer transition-colors ${isDragActive ? 'border-[var(--color-primary)] bg-black/5' : 'border-[var(--color-border)]'}`}
        style={{ height }}
      >
        <Upload size={30} className="text-[var(--color-text-disabled)] mb-1" />
        {Array.isArray(label) ? label.map((line, i) => (
          <span key={i} className="text-sm text-[var(--color-text-disabled)]">{line}</span>
        )) : <span className="text-sm text-[var(--color-text-disabled)] whitespace-pre-wrap">{label}</span>}
      </div>

      <input ref={fileInputRef} type="file" multiple={multiple} accept="image/*" onChange={(e) => processFiles(e.target.files)} className="hidden" />

      {error && <p className="text-red-500 text-xs mt-2">{error}</p>}

      {imagePreviews.length > 0 && (
        <div className="mt-6">
          <p className="text-xs font-semibold text-[var(--color-text-primary)] mb-4">업로드된 이미지 ({imagePreviews.length})</p>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
            {imagePreviews.map((preview, index) => (
              <div key={index} className="relative rounded-lg overflow-hidden border border-[var(--color-border)]" style={{ width: previewSize, height: previewSize }}>
                <img src={preview.preview} alt={`preview-${index}`} className="w-full h-full object-cover" />
                <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/70 to-transparent text-white p-2">
                  <p className="text-[11px] truncate">{preview.file.name}</p>
                  <p className="text-[11px] opacity-80">{formatFileSize(preview.file.size)}</p>
                </div>
                <button
                  type="button"
                  onClick={(e) => { e.stopPropagation(); handleRemoveImage(index); }}
                  className="absolute top-1 right-1 w-6 h-6 flex items-center justify-center rounded-full bg-black/50 text-white hover:bg-black/70"
                >
                  <X size={14} />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default ImageUploadInput;
