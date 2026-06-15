import React from 'react';
import { PrimaryButton, GrayButton, GhostButton } from '@/shared/components/button/CustomButton';
import type { UploadCardProps, UploadCardAction } from './types';
import { FILE_TYPE_ICONS, FILE_TYPE_ICON_COLORS, FILE_ICON_SIZE } from './constants';

export const UploadCard: React.FC<UploadCardProps> = ({
  fileType, fileName, fileSize, uploadDate, actions, className, style,
}) => {
  const iconColor = FILE_TYPE_ICON_COLORS[fileType] || FILE_TYPE_ICON_COLORS.default;
  const IconComponent = FILE_TYPE_ICONS[fileType] || FILE_TYPE_ICONS.default;

  const renderActionButton = (action: UploadCardAction, index: number) => {
    const buttonProps = {
      key: index,
      heightType: 'h32' as const,
      disabled: action.disabled,
      onClick: action.onClick,
      ...(action.icon && { startIcon: action.icon }),
    };

    switch (action.variant) {
      case 'primary':
        return <PrimaryButton {...buttonProps}>{action.label}</PrimaryButton>;
      case 'ghost':
        return <GhostButton {...buttonProps}>{action.label}</GhostButton>;
      default:
      case 'gray':
        return <GrayButton {...buttonProps}>{action.label}</GrayButton>;
    }
  };

  return (
    <div
      className={`flex flex-col w-80 border border-[var(--color-border)] rounded-lg bg-[var(--color-bg-primary)] ${className ?? ''}`}
      style={style}
    >
      {/* 상단: 아이콘 + 파일 정보 */}
      <div className="flex items-center gap-3.5 mx-4 py-3.5 border-b border-[var(--color-border)]">
        <div className="shrink-0 flex items-center justify-center">
          <IconComponent size={FILE_ICON_SIZE} style={{ color: iconColor }} />
        </div>
        <div className="flex-1 flex flex-col justify-center min-w-0">
          <span className="text-sm font-semibold text-[var(--color-text-primary)] truncate">
            {fileName}
          </span>
          <span className="text-xs text-[var(--color-text-secondary)]">
            {fileSize} · {uploadDate}
          </span>
        </div>
      </div>

      {/* 하단: 액션 버튼들 */}
      <div className="flex justify-end items-center px-4 py-3">
        <div className="flex items-center gap-2">
          {actions.map((action, index) => renderActionButton(action, index))}
        </div>
      </div>
    </div>
  );
};

export default UploadCard;
