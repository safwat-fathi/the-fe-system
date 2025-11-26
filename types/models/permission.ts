/**
 * Permission Types
 * Handles user permissions and role-based access control
 */

import { ObjectPermission, MergedPermissions } from "./menu";

export interface Permission {
  id: number;
  name: string;
  name_en?: string;
  description?: string;
}

export interface UserGroup {
  id: number;
  name: string;
  name_en?: string;
  description?: string;
  permissions?: ObjectPermission[];
}

export interface UserGroupMember {
  id: number;
  user_id: number;
  group_id: number;
  group?: UserGroup;
}

export interface UserPermission {
  id: number;
  user_id: number;
  object_id: number;
  permissions: string[];
  granted_at?: string;
}

export interface GroupPermission {
  id: number;
  group_id: number;
  object_id: number;
  permissions: string[];
  granted_at?: string;
}

export interface PermissionCheckResult {
  hasAccess: boolean;
  grantedPermissions: string[];
  requiredPermissions: string[];
}

export type { ObjectPermission, MergedPermissions };
