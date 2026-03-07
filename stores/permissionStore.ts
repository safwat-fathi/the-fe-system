import { create } from "zustand";

import {
  buildAbility,
  type AppAbility,
  type AppAbilities,
} from "@/lib/casl/ability";

export interface BackendPermission {
  com: number;
  obj: number;
  obj_name: string;
  priv_status: boolean;
  obj_source: string;
  parent_obj_name: string;
  group: number;
  rule_name: string | null;
}

interface PermissionState {
  permissions: BackendPermission[] | null;
  ability: AppAbility;
  isLoading: boolean;
  error: string | null;

  // Actions
  setPermissions: (permissions: BackendPermission[]) => void;
  clearPermissions: () => void;
  setLoading: (isLoading: boolean) => void;
  setError: (error: string | null) => void;

  // Helpers
  hasPermission: (objectId: number, permission: AppAbilities[0]) => boolean;
  hasAnyPermission: (
    objectId: number,
    permissions: AppAbilities[0][],
  ) => boolean;
  hasAllPermissions: (
    objectId: number,
    permissions: AppAbilities[0][],
  ) => boolean;
}

const initialState = {
  permissions: null,
  ability: buildAbility([]),
  isLoading: false,
  error: null,
};

export const usePermissionStore = create<PermissionState>((set, get) => ({
  ...initialState,

  setPermissions: (permissions: BackendPermission[]) => {
    set({
      permissions,
      ability: buildAbility(permissions || []),
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

  hasPermission: (objectId: number, permission: AppAbilities[0]) => {
    return get().ability.can(permission, String(objectId));
  },

  hasAnyPermission: (objectId: number, permissions: AppAbilities[0][]) => {
    return permissions.some((permission) =>
      get().ability.can(permission, String(objectId)),
    );
  },

  hasAllPermissions: (objectId: number, permissions: AppAbilities[0][]) => {
    return permissions.every((permission) =>
      get().ability.can(permission, String(objectId)),
    );
  },
}));
