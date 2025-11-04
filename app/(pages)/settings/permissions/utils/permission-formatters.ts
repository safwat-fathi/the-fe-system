/**
 * Permission Formatters
 * Utility functions for formatting and displaying permissions
 */

import { PermissionType, PERMISSION_TYPES } from "../types/permissions";

/**
 * Get Arabic label for permission type
 */
export const getPermissionLabel = (permission: PermissionType | string): string => {
  const labels: Record<string, string> = {
    [PERMISSION_TYPES.VIEW]: "عرض",
    [PERMISSION_TYPES.CREATE]: "إضافة",
    [PERMISSION_TYPES.EDIT]: "تعديل",
    [PERMISSION_TYPES.DELETE]: "حذف",
    [PERMISSION_TYPES.PRINT]: "طباعة",
    [PERMISSION_TYPES.EXPORT]: "تصدير",
  };

  return labels[permission] || permission;
};

/**
 * Get color for permission type (for badges/chips)
 */
export const getPermissionColor = (
  permission: PermissionType | string,
): "default" | "primary" | "secondary" | "success" | "warning" | "danger" => {
  const colors: Record<string, "default" | "primary" | "secondary" | "success" | "warning" | "danger"> = {
    [PERMISSION_TYPES.VIEW]: "default",
    [PERMISSION_TYPES.CREATE]: "success",
    [PERMISSION_TYPES.EDIT]: "primary",
    [PERMISSION_TYPES.DELETE]: "danger",
    [PERMISSION_TYPES.PRINT]: "secondary",
    [PERMISSION_TYPES.EXPORT]: "secondary",
  };

  return colors[permission] || "default";
};

/**
 * Get icon for permission type
 */
export const getPermissionIcon = (permission: PermissionType | string): string => {
  const icons: Record<string, string> = {
    [PERMISSION_TYPES.VIEW]: "👁️",
    [PERMISSION_TYPES.CREATE]: "+",
    [PERMISSION_TYPES.EDIT]: "✏️",
    [PERMISSION_TYPES.DELETE]: "🗑️",
    [PERMISSION_TYPES.PRINT]: "🖨️",
    [PERMISSION_TYPES.EXPORT]: "📥",
  };

  return icons[permission] || "•";
};

/**
 * Format permission list for display
 */
export const formatPermissionsList = (
  permissions: (PermissionType | string)[],
): string => {
  return permissions.map(getPermissionLabel).join(", ");
};

