import { buildAbility } from "./ability";

import userService from "@/app/[locale]/(pages)/settings/permissions/services/user.service";

export async function getServerAbility() {
  const response = await userService.getAuthPermissions();

  if (!response?.success || !response?.data?.permissions) {
    return buildAbility([]);
  }

  return buildAbility(response.data.permissions);
}
