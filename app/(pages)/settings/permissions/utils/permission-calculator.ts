/**
 * Permission Calculator
 * Calculates merged permissions from groups and user-specific permissions
 */

import { MergedPermissions, ObjectPermission } from "../types/permissions";
import { Group } from "../types/groups";
import { User } from "../types/users";
import { mergePermissions } from "./permission-helpers";

/**
 * Calculate merged permissions for a user
 * Combines group permissions and user-specific permissions
 */
export const calculateUserPermissions = (
  groups: Group[],
  groupPermissions: Record<number, ObjectPermission[]>,
  userPermissions: ObjectPermission[],
): MergedPermissions => {
  // Collect all group permissions
  const allGroupPermissions: Record<string, string[]> = {};

  groups.forEach((group) => {
    const permissions = groupPermissions[group.id] || [];

    permissions.forEach((perm) => {
      const objectId = perm.object_id.toString();

      if (!allGroupPermissions[objectId]) {
        allGroupPermissions[objectId] = [];
      }

      allGroupPermissions[objectId].push(...perm.permissions);
    });
  });

  // Collect user-specific permissions
  const userPerms: Record<string, string[]> = {};

  userPermissions.forEach((perm) => {
    const objectId = perm.object_id.toString();

    if (!userPerms[objectId]) {
      userPerms[objectId] = [];
    }

    userPerms[objectId].push(...perm.permissions);
  });

  // Merge group and user permissions
  return mergePermissions(allGroupPermissions, userPerms);
};

/**
 * Get permissions for a specific object
 */
export const getObjectPermissions = (
  mergedPermissions: MergedPermissions,
  objectId: number,
): string[] => {
  return mergedPermissions[objectId.toString()] || [];
};

/**
 * Check if user has permission on object (from merged permissions)
 */
export const checkPermission = (
  mergedPermissions: MergedPermissions,
  objectId: number,
  permission: string,
): boolean => {
  const objectPermissions = getObjectPermissions(mergedPermissions, objectId);

  return objectPermissions.includes(permission);
};

