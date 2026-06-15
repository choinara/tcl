import React, { useRef, useState } from 'react';
import { CloudUpload, X } from 'lucide-react';

export interface DragDropFileInputProps {
  onFilesSelected: (files: File[]) => void;
  accept?: string;
  maxSize?: number;
  multiple?: boolean;
  height?: string | number;
  label?: string;
}

const formatFileSize = (bytes: number): string => {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + ' ' + sizes[i];
};

export const DragDropFileInput: React.FC<DragDropFileInputProps> = ({
  onFilesSelected,
  accept = '*',
  maxSize,
  multiple = true,
  height = '150px',
  label = '파일을 드래그하거나 클릭하여 선택하세요',
}) => {
  const [isDragActive, setIsDragActive] = useState(false);
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [error, setError] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const validateFiles = (files: FileList | null): File[] => {
    if (!files) return [];
    const valid: File[] = [];
    setError('');
    Array.from(files).forEach((file) => {
      if (maxSize && file.size > maxSize) { setError(`파일 크기가 ${formatFileSize(maxSize)}를 초과했습니다`); return; }
      valid.push(file);
    });
    return valid;
  };

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault(); e.stopPropagation();
    setIsDragActive(e.type === 'dragenter' || e.type === 'dragover');
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault(); e.stopPropagation(); setIsDragActive(false);
    const files = validateFiles(e.dataTransfer.files);
    if (files.length > 0) { const next = multiple ? [...selectedFiles, ...files] : files; setSelectedFiles(next); onFilesSelected(next); }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = validateFiles(e.target.files);
    if (files.length > 0) { const next = multiple ? [...selectedFiles, ...files] : files; setSelectedFiles(next); onFilesSelected(next); }
  };

  const handleRemoveFile = (index: number) => {
    const next = selectedFiles.filter((_, i) => i !== index);
    setSelectedFiles(next);
    onFilesSelected(next);
  };

  return (
    <div className="w-full">
      <div
        onDragEnter={handleDrag} onDragLeave={handleDrag} onDragOver={handleDrag} onDrop={handleDrop}
        onClick={() => fileInputRef.current?.click()}
        className={`flex flex-col items-center justify-center border-2 border-dashed rounded-lg cursor-pointer transition-all ${isDragActive ? 'border-[var(--color-primary)] bg-black/5' : 'border-[var(--color-border)] hover:border-[var(--color-primary)] hover:bg-black/5'}`}
        style={{ height }}
      >
        <CloudUpload size={40} className="text-[var(--color-primary)] mb-2" />
        <span className="text-sm font-medium text-[var(--color-text-primary)]">{label}</span>
        <span className="text-xs text-[var(--color-text-disabled)] mt-1">또는 클릭하여 파일을 선택하세요</span>
      </div>

      <input ref={fileInputRef} type="file" multiple={multiple} accept={accept} onChange={handleInputChange} className="hidden" />

      {error && <p className="text-red-500 text-xs mt-2">{error}</p>}

      {selectedFiles.length > 0 && (
        <div className="mt-4 flex flex-col gap-2">
          <span className="text-xs font-semibold text-[var(--color-text-primary)]">선택된 파일 ({selectedFiles.length})</span>
          {selectedFiles.map((file, index) => (
            <div key={index} className="flex justify-between items-center px-3 py-2 bg-gray-50 rounded border border-[var(--color-border)]">
              <div>
                <p className="text-[13px] font-medium text-[var(--color-text-primary)]">{file.name}</p>
                <p className="text-xs text-[var(--color-text-disabled)]">{formatFileSize(file.size)}</p>
              </div>
              <button type="button" onClick={() => handleRemoveFile(index)} className="text-[var(--color-text-disabled)] hover:text-[var(--color-text-primary)]">
                <X size={16} />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default DragDropFileInput;
