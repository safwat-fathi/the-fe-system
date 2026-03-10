/**
 * Core Permission Types
 * Types for permissions system
 */

export const PERMISSION_TYPES = {
  VIEW: "view",
  CREATE: "create",
  UPDATE: "update",
  DELETE: "delete",
  PRINT: "print",
  EXPORT: "export",
} as const;

export type PermissionType =
  (typeof PERMISSION_TYPES)[keyof typeof PERMISSION_TYPES];

export interface MergedPermissions {
  [objectId: string]: string[];
}

export interface ObjectPermission {
  object_id: number;
  permissions: PermissionType[];
  source: "group" | "user";
}
