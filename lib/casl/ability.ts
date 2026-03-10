import {
  AbilityBuilder,
  createMongoAbility,
  MongoAbility,
} from "@casl/ability";

import { normalizeAction } from "@/utilities/auth/authorization-core";

export type AppAbilities = [
  (
    | "view"
    | "create"
    | "update"
    | "delete"
    | "manage"
    | "print"
    | "export"
  ),
  string | "all",
];

export type AppAbility = MongoAbility<AppAbilities>;

export const AppAbility = createMongoAbility<AppAbility>();

interface BackendPermission {
  com: number;
  obj: number;
  obj_name: string;
  priv_status: boolean;
  obj_source: string;
  parent_obj_name: string;
  group: number;
  rule_name: string | null;
}

export function buildAbility(rawPermissions: BackendPermission[]) {
  const { can, build } = new AbilityBuilder<AppAbility>(createMongoAbility);

  if (
    !rawPermissions ||
    !Array.isArray(rawPermissions) ||
    rawPermissions.length === 0
  ) {
    return build();
  }

  rawPermissions.forEach((item) => {
    if (!item.priv_status || !item.obj_source) return;

    const sources = item.obj_source.split(",").map((s) => s.trim());

    sources.forEach((source) => {
      const lastDot = source.lastIndexOf(".");

      if (lastDot === -1) return;

      const subject = source.substring(0, lastDot);
      const action = normalizeAction(source.substring(lastDot + 1));

      if (!action) {
        return;
      }

      can(action, subject);
    });
  });

  return build();
}
