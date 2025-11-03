import {
  MergedPermissions,
  PermissionType,
  PERMISSION_TYPES,
} from "@/types/models/menu";

/**
 * Permission utility functions
 */

/**
 * Check if user has specific permission on an object
 */
export const hasPermission = (
  permissions: MergedPermissions,
  objectId: number,
  permission: PermissionType | string,
): boolean => {
  const objectPermissions = permissions[objectId.toString()] || [];

  return objectPermissions.includes(permission as string);
};

/**
 * Check if user has any of the required permissions
 */
export const hasAnyPermission = (
  permissions: MergedPermissions,
  objectId: number,
  requiredPermissions: (PermissionType | string)[],
): boolean => {
  const objectPermissions = permissions[objectId.toString()] || [];

  return requiredPermissions.some((perm) =>
    objectPermissions.includes(perm as string),
  );
};

/**
 * Check if user has all required permissions
 */
export const hasAllPermissions = (
  permissions: MergedPermissions,
  objectId: number,
  requiredPermissions: (PermissionType | string)[],
): boolean => {
  const objectPermissions = permissions[objectId.toString()] || [];

  return requiredPermissions.every((perm) =>
    objectPermissions.includes(perm as string),
  );
};

/**
 * Merge permissions from groups and user-specific permissions
 * Group permissions + user permissions (union)
 */
export const mergePermissions = (
  groupPermissions: Record<string, (PermissionType | string)[]>,
  userPermissions: Record<string, (PermissionType | string)[]>,
): MergedPermissions => {
  const merged: MergedPermissions = {};
  Object.entries(groupPermissions).forEach(([key, value]) => {
    merged[key] = value as string[];
  });

  // Add user permissions to the merged set
  for (const [objectId, perms] of Object.entries(userPermissions)) {
    if (merged[objectId]) {
      // Merge with existing permissions (union)
      merged[objectId] = Array.from(
        new Set([...merged[objectId], ...(perms as string[])]),
      );
    } else {
      // Add new permissions
      merged[objectId] = perms as string[];
    }
  }

  return merged;
};

/**
 * Check if a path requires specific permissions
 */
export const getPathPermissions = (
  path: string,
  routePermissions: Record<string, string[]>,
): string[] => {
  // Check for exact match first
  if (routePermissions[path]) {
    return routePermissions[path];
  }

  // Check for wildcard matches
  const wildcardMatches = Object.entries(routePermissions)
    .filter(([route]) => route.endsWith("/*"))
    .filter(([route]) => path.startsWith(route.replace("/*", "/")))
    .map(([_, perms]) => perms);

  return wildcardMatches.length > 0 ? wildcardMatches[0] : [];
};

/**
 * Filter menu items based on user permissions
 * Only show items the user has 'view' permission for
 */
export const filterMenuByPermissions = (
  menuItems: any[],
  permissions: MergedPermissions,
): any[] => {
  return menuItems
    .map((item) => {
      // Check if this item requires view permission
      if (item.path && item.id) {
        const hasViewAccess = hasPermission(
          permissions,
          item.id,
          PERMISSION_TYPES.VIEW,
        );

        if (!hasViewAccess) {
          return null;
        }
      }

      // Recursively filter children
      if (item.children && item.children.length > 0) {
        const filteredChildren = filterMenuByPermissions(
          item.children,
          permissions,
        );

        // If has children, keep the parent
        if (filteredChildren.length > 0) {
          return {
            ...item,
            children: filteredChildren,
          };
        }

        // If no valid children but parent has no path requirement, keep it
        if (!item.path) {
          return {
            ...item,
            children: [],
          };
        }

        return null;
      }

      return item;
    })
    .filter((item) => item !== null);
};
