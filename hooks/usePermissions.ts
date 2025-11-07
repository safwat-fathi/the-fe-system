import { usePermissionStore } from "@/stores/permissionStore";

/**
 * Custom hook for checking user permissions
 */
export const usePermissions = () => {
  const permissions = usePermissionStore((state) => state.permissions);
  const mergedPermissions = usePermissionStore(
    (state) => state.mergedPermissions,
  );
  const hasPermission = usePermissionStore((state) => state.hasPermission);
  const hasAnyPermission = usePermissionStore(
    (state) => state.hasAnyPermission,
  );
  const hasAllPermissions = usePermissionStore(
    (state) => state.hasAllPermissions,
  );

  return {
    permissions,
    mergedPermissions,
    hasPermission,
    hasAnyPermission,
    hasAllPermissions,
  };
};

/**
 * Hook to check a specific permission
 */
export const usePermission = (objectId: number, permission: string) => {
  const hasPermission = usePermissionStore((state) =>
    state.hasPermission(objectId, permission),
  );

  return hasPermission;
};

/**
 * Hook to check multiple permissions (any)
 */
export const useAnyPermission = (objectId: number, permissions: string[]) => {
  const hasAnyPermission = usePermissionStore((state) =>
    state.hasAnyPermission(objectId, permissions),
  );

  return hasAnyPermission;
};

/**
 * Hook to check multiple permissions (all)
 */
export const useAllPermissions = (objectId: number, permissions: string[]) => {
  const hasAllPermissions = usePermissionStore((state) =>
    state.hasAllPermissions(objectId, permissions),
  );

  return hasAllPermissions;
};
