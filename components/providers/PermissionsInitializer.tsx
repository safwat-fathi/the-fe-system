"use client";

import { useEffect, useRef } from "react";

import {
  usePermissionStore,
  type BackendPermission,
} from "@/stores/permissionStore";

interface PermissionsInitializerProps {
  permissions: BackendPermission[] | null;
}

export function PermissionsInitializer({
  permissions,
}: PermissionsInitializerProps) {
  const setPermissions = usePermissionStore((state) => state.setPermissions);
  const initialized = useRef(false);

  useEffect(() => {
    if (permissions && !initialized.current) {
      setPermissions(permissions);
      initialized.current = true;
    }
  }, [permissions, setPermissions]);

  return null;
}
