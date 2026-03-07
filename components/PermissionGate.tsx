"use client";

import { ReactNode } from "react";

import { usePermissionStore } from "@/stores/permissionStore";
import { AppAbilities } from "@/lib/casl/ability";

export interface PermissionGateProps {
  objectId: number;
  permission: AppAbilities[0] | AppAbilities[0][];
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
      ? hasPermission(objectId, permission as AppAbilities[0])
      : requireAll
        ? hasAllPermissions(objectId, permission as AppAbilities[0][])
        : hasAnyPermission(objectId, permission as AppAbilities[0][]);

  if (!hasAccess) {
    return <>{fallback}</>;
  }

  return <>{children}</>;
}
