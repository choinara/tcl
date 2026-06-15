import React from 'react';
import { Search, Info } from 'lucide-react';
import Dialog from './Dialog';
import Input from '../input/Input';

export interface SearchDialogProps {
  open: boolean;
  onClose: () => void;
  title: string;
  subtitle: string;
  width?: string;
  keyword1: string;
  onKeyword1Change: (v: string) => void;
  keyword1Placeholder: string;
  keyword2?: string;
  onKeyword2Change?: (v: string) => void;
  keyword2Placeholder?: string;
  exactMatch?: boolean;
  onExactMatchChange?: (v: boolean) => void;
  showExactMatch?: boolean;
  onSearch: () => void;
  infoTitle?: string;
  infoDescription?: string;
  onRegisterNew?: () => void;
  registerNewLabel?: string;
  children: React.ReactNode;
}

export const SearchDialog = ({
  open,
  onClose,
  title,
  subtitle,
  width = '900px',
  keyword1,
  onKeyword1Change,
  keyword1Placeholder,
  keyword2,
  onKeyword2Change,
  keyword2Placeholder,
  exactMatch,
  onExactMatchChange,
  showExactMatch = true,
  onSearch,
  infoTitle,
  infoDescription,
  onRegisterNew,
  registerNewLabel = '+ 신규 등록',
  children,
}: SearchDialogProps) => {
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') onSearch();
  };

  return (
    <Dialog
      open={open}
      onClose={onClose}
      title={title}
      subtitle={subtitle}
      width={width}
      height="auto"
      actions={
        <div>
          <button className="mes-btn" style={{ padding: '6px 16px', fontSize: 14 }} onClick={onClose}>
            취소
          </button>
        </div>
      }
    >
      <div className="flex items-center gap-2 px-6 py-2 border-b border-[var(--color-border)]">
        <Input
          heightType="h40"
          value={keyword1}
          onChange={onKeyword1Change}
          onKeyDown={handleKeyDown}
          placeholder={keyword1Placeholder}
          showClearButton
          sx={{ flex: 1 }}
        />
        {showExactMatch && onExactMatchChange && (
          <label className="flex items-center gap-2 whitespace-nowrap cursor-pointer">
            <input
              type="checkbox"
              checked={exactMatch ?? false}
              onChange={(e) => onExactMatchChange(e.target.checked)}
              className="w-4 h-4"
            />
            <span className="text-[13px]">일치검색</span>
          </label>
        )}
        {onKeyword2Change !== undefined && (
          <Input
            heightType="h40"
            value={keyword2 ?? ''}
            onChange={onKeyword2Change}
            onKeyDown={handleKeyDown}
            placeholder={keyword2Placeholder ?? ''}
            showClearButton
            sx={{ flex: 1 }}
          />
        )}
        <button
          className="mes-btn mes-btn-search"
          style={{ padding: '6px 12px', display: 'inline-flex', alignItems: 'center', gap: 4 }}
          onClick={onSearch}
        >
          <Search size={16} />
          검색
        </button>
      </div>

      <div className="flex flex-col gap-4 px-6 py-4">
        {children}

        {infoTitle && (
          <div className="flex items-center justify-between px-4 py-3 bg-[#F8F9FA] border border-[#DFE1E6] rounded">
            <div className="flex items-start gap-2">
              <Info size={18} className="text-[#5B7FFF] mt-0.5 shrink-0" />
              <div>
                <p className="text-[13px] font-semibold text-[#172B4D]">{infoTitle}</p>
                {infoDescription && (
                  <p className="text-[12px] text-[#5F6B7A] mt-0.5">{infoDescription}</p>
                )}
              </div>
            </div>
            {onRegisterNew && (
              <button className="mes-btn" style={{ fontSize: 13 }} onClick={onRegisterNew}>
                {registerNewLabel}
              </button>
            )}
          </div>
        )}
      </div>
    </Dialog>
  );
};

export default SearchDialog;
