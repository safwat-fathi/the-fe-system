import { create } from "zustand";

import { UserPermissions, MergedPermissions } from "@/types/models/menu";

interface PermissionState {
  permissions: UserPermissions | null;
  mergedPermissions: MergedPermissions;
  isLoading: boolean;
  error: string | null;

  // Actions
  setPermissions: (permissions: UserPermissions) => void;
  clearPermissions: () => void;
  setLoading: (isLoading: boolean) => void;
  setError: (error: string | null) => void;

  // Helpers
  hasPermission: (objectId: number, permission: string) => boolean;
  hasAnyPermission: (objectId: number, permissions: string[]) => boolean;
  hasAllPermissions: (objectId: number, permissions: string[]) => boolean;
}

const initialState = {
  permissions: null,
  mergedPermissions: {},
  isLoading: false,
  error: null,
};

export const usePermissionStore = create<PermissionState>((set, get) => ({
  ...initialState,

  setPermissions: (permissions: UserPermissions) => {
    set({
      permissions,
      mergedPermissions: permissions.merged_permissions,
      error: null,
    });
  },

  clearPermissions: () => {
    set(initialState);
  },

  setLoading: (isLoading: boolean) => {
    set({ isLoading });
  },

  setError: (error: string | null) => {
    set({ error, isLoading: false });
  },

  hasPermission: (objectId: number, permission: string) => {
    const { mergedPermissions } = get();
    const objectPermissions = mergedPermissions[objectId.toString()] || [];

    return objectPermissions.includes(permission);
  },

  hasAnyPermission: (objectId: number, permissions: string[]) => {
    const { mergedPermissions } = get();
    const objectPermissions = mergedPermissions[objectId.toString()] || [];

    return permissions.some((perm) => objectPermissions.includes(perm));
  },

  hasAllPermissions: (objectId: number, permissions: string[]) => {
    const { mergedPermissions } = get();
    const objectPermissions = mergedPermissions[objectId.toString()] || [];

    return permissions.every((perm) => objectPermissions.includes(perm));
  },
}));
