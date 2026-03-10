import { buildAbility } from "./ability";

import userService from "@/app/[locale]/(pages)/settings/permissions/services/user.service";
import { resolvePermissionsFromPayload } from "@/utilities/auth/authorization-core";

export async function getServerAbility() {
  const response = await userService.getAuthPermissions();

  if (!response?.success) {
    return buildAbility([]);
  }

  const parsed = resolvePermissionsFromPayload(response.data ?? response);

  if (!parsed.hasPermissionsArray) {
    return buildAbility([]);
  }

  return buildAbility(parsed.permissions);
}
