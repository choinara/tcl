import { useAuthStore, type PermissionSet } from '@/stores/useAuthStore';

const NO_PERMISSION: PermissionSet = {
  canRead: false,
  canCreate: false,
  canUpdate: false,
  canDelete: false,
  canExport: false,
  canViewPii: false,
  canApprove: false,
};

export function usePermission(menuCode: string): PermissionSet & { loading: boolean } {
  const permissionMap = useAuthStore((s) => s.permissionMap);
  const initialized = useAuthStore((s) => s.initialized);

  const perm = permissionMap[menuCode] ?? NO_PERMISSION;

  return {
    ...perm,
    loading: !initialized,
  };
}
