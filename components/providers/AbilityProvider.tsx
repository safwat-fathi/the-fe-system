"use client";

import { createContext } from "react";
import { createContextualCan } from "@casl/react";

import { AppAbility } from "@/lib/casl/ability";
import { usePermissionStore } from "@/stores/permissionStore";

export const AbilityContext = createContext<AppAbility>({} as AppAbility);
export const Can = createContextualCan(AbilityContext.Consumer);

export function AbilityProvider({ children }: { children: React.ReactNode }) {
  const ability = usePermissionStore((state) => state.ability);

  return (
    <AbilityContext.Provider value={ability}>
      {children}
    </AbilityContext.Provider>
  );
}
