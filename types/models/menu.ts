/**
 * Menu and Navigation Types
 * Handles dynamic menu structure from objects table
 */

export const OBJECT_TYPES = {
  MODULE: "module",
  SECTION: "section",
  SCREEN: "screen",
} as const;

export const PERMISSION_TYPES = {
  VIEW: "view",
  CREATE: "create",
  EDIT: "edit",
  DELETE: "delete",
  PRINT: "print",
  EXPORT: "export",
} as const;

export type ObjectType = (typeof OBJECT_TYPES)[keyof typeof OBJECT_TYPES];

export type PermissionType =
  (typeof PERMISSION_TYPES)[keyof typeof PERMISSION_TYPES];

export interface MenuObject {
  id: number;
  name: string;
  name_en?: string;
  parent_id: number | null;
  icon?: string;
  path?: string;
  order: number;
  type: ObjectType;
  is_active: boolean;
  children?: MenuObject[];
  permissions?: PermissionType[];
}

export interface MenuResponse {
  data: MenuObject[];
}

export interface Group {
  id: number;
  name: string;
  name_en?: string;
  description?: string;
}

export interface ObjectPermission {
  object_id: number;
  permissions: PermissionType[];
  source: "group" | "user";
}

export interface MergedPermissions {
  [objectId: string]: string[];
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
