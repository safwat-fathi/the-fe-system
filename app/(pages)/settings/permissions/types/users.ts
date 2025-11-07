/**
 * User Types
 * Types for users in permissions system
 */

import { Group } from "./groups";
import { MergedPermissions, ObjectPermission } from "./permissions";

export interface User {
  id: number;
  username: string;
  email: string;
  first_name?: string;
  last_name?: string;
  is_staff: boolean;
  is_active: boolean;
  created_at?: string;
  updated_at?: string;
}

export interface UserPermission {
  id: number;
  user_id: number;
  object_id: number;
  permissions: string[];
  granted_at?: string;
}

export interface UserWithGroups extends User {
  groups: Group[];
  user_permissions: Array<{
    codename: string;
    name: string;
    content_type: number;
  }>;
}

export interface UserPermissions {
  user_id: number;
  groups: Group[];
  permissions: ObjectPermission[];
  merged_permissions: MergedPermissions;
}

export interface UserPermissionsResponse {
  data: UserPermissions;
}

