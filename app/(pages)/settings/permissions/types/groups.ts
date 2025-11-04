/**
 * Group Types
 * Types for user groups
 */

import { ObjectPermission } from "./permissions";

export interface Group {
  id: number;
  name: string;
  name_en?: string;
  description?: string;
  is_active?: boolean;
  created_at?: string;
  updated_at?: string;
}

export interface GroupPermission {
  id: number;
  group_id: number;
  object_id: number;
  permissions: string[];
  granted_at?: string;
}

export interface GroupWithPermissions extends Group {
  permissions: ObjectPermission[];
  users_count?: number;
}

