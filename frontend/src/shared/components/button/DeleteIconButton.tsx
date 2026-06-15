import React from 'react';
import { Trash2 } from 'lucide-react';
import { GhostButton } from './CustomButton';

interface DeleteIconButtonProps {
  onClick: (e: React.MouseEvent) => void;
  disabled?: boolean;
}

export const DeleteIconButton = ({ onClick, disabled }: DeleteIconButtonProps) => (
  <div className="flex justify-center items-center">
    <GhostButton iconOnly onClick={onClick} disabled={disabled}>
      <Trash2 size={18} />
    </GhostButton>
  </div>
);
