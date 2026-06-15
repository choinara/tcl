import type { ReactNode } from 'react';
import { usePermission } from '@/hooks/usePermission';

interface PermissionGuardProps {
  menuCode: string;
  action: 'read' | 'create' | 'update' | 'delete' | 'export';
  children: ReactNode;
  fallback?: ReactNode;
}

const actionMap: Record<string, keyof ReturnType<typeof usePermission>> = {
  read: 'canRead',
  create: 'canCreate',
  update: 'canUpdate',
  delete: 'canDelete',
  export: 'canExport',
};

export function PermissionGuard({ menuCode, action, children, fallback = null }: PermissionGuardProps) {
  const perm = usePermission(menuCode);

  if (perm.loading) return null;

  const permKey = actionMap[action];
  if (!permKey || !perm[permKey]) {
    return <>{fallback}</>;
  }

  return <>{children}</>;
}
