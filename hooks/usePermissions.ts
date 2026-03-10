import { usePermissionStore } from "@/stores/permissionStore";
import { AppAbilities } from "@/lib/casl/ability";

/**
 * Custom hook for checking user permissions
 */
export const usePermissions = () => {
  const permissions = usePermissionStore((state) => state.permissions);
  const hasPermission = usePermissionStore((state) => state.hasPermission);
  const hasAnyPermission = usePermissionStore(
    (state) => state.hasAnyPermission,
  );
  const hasAllPermissions = usePermissionStore(
    (state) => state.hasAllPermissions,
  );

  return {
    permissions,
    hasPermission,
    hasAnyPermission,
    hasAllPermissions,
  };
};

/**
 * Hook to check a specific permission
 */
export const usePermission = (
  objectId: number,
  permission: AppAbilities[0],
) => {
  const hasPermission = usePermissionStore((state) =>
    state.hasPermission(objectId, permission),
  );

  return hasPermission;
};

/**
 * Hook to check multiple permissions (any)
 */
export const useAnyPermission = (
  objectId: number,
  permissions: AppAbilities[0][],
) => {
  const hasAnyPermission = usePermissionStore((state) =>
    state.hasAnyPermission(objectId, permissions),
  );

  return hasAnyPermission;
};

/**
 * Hook to check multiple permissions (all)
 */
export const useAllPermissions = (
  objectId: number,
  permissions: AppAbilities[0][],
) => {
  const hasAllPermissions = usePermissionStore((state) =>
    state.hasAllPermissions(objectId, permissions),
  );

  return hasAllPermissions;
};
