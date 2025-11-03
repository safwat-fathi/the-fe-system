"use client";

import { ReactNode } from "react";

import { usePermissionStore } from "@/stores/permissionStore";

export interface PermissionGateProps {
  objectId: number;
  permission: string | string[];
  children: ReactNode;
  fallback?: ReactNode;
  requireAll?: boolean;
}

/**
 * PermissionGate Component
 * Controls component visibility based on user permissions
 */
export default function PermissionGate({
  objectId,
  permission,
  children,
  fallback = null,
  requireAll = false,
}: PermissionGateProps) {
  const hasPermission = usePermissionStore((state) => state.hasPermission);
  const hasAnyPermission = usePermissionStore(
    (state) => state.hasAnyPermission,
  );
  const hasAllPermissions = usePermissionStore(
    (state) => state.hasAllPermissions,
  );

  const hasAccess =
    typeof permission === "string"
      ? hasPermission(objectId, permission)
      : requireAll
        ? hasAllPermissions(objectId, permission)
        : hasAnyPermission(objectId, permission);

  if (!hasAccess) {
    return <>{fallback}</>;
  }

  return <>{children}</>;
}
