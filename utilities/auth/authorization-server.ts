import { cookies } from "next/headers";

import {
  type CanonicalAction,
  fetchUserPermissionMap,
  hasPermission,
  normalizeAction,
  type PermissionMap,
} from "@/utilities/auth/authorization-core";
import {
  AuthenticationError,
  AuthorizationError,
} from "@/utilities/errors/Authentication";
import { STORAGE_KEYS } from "@/constants";
import { isTokenValid } from "@/utilities/token";

export const assertAuthorized = async ({
  subject,
  action,
}: {
  subject: string;
  action: CanonicalAction | string;
}): Promise<void> => {
  const { isAdmin, permissionMap } = await getServerPermissionMap();
  const normalizedAction = normalizeAction(action);

  if (!normalizedAction) {
    throw new AuthorizationError(`Unknown permission action: ${action}`);
  }

  if (isAdmin) {
    return;
  }

  const canAccess = hasPermission(permissionMap, subject, normalizedAction);

  if (!canAccess) {
    throw new AuthorizationError("غير مصرح لك بتنفيذ هذا الإجراء");
  }
};

export const assertAnyAuthorized = async (
  requirements: Array<{ subject: string; action: CanonicalAction | string }>,
): Promise<void> => {
  if (!requirements.length) {
    throw new AuthorizationError("Missing authorization requirements");
  }

  const { isAdmin, permissionMap } = await getServerPermissionMap();

  if (isAdmin) {
    return;
  }

  for (const requirement of requirements) {
    const normalizedAction = normalizeAction(requirement.action);

    if (!normalizedAction) {
      continue;
    }

    if (hasPermission(permissionMap, requirement.subject, normalizedAction)) {
      return;
    }
  }

  throw new AuthorizationError("غير مصرح لك بتنفيذ هذا الإجراء");
};

const getServerPermissionMap = async (): Promise<{
  isAdmin: boolean;
  permissionMap: PermissionMap;
}> => {
  const cookieStore = await cookies();
  const accessToken = cookieStore.get(STORAGE_KEYS.ACCESS_TOKEN)?.value;
  const username = cookieStore.get(STORAGE_KEYS.USERNAME)?.value;
  const companyId = cookieStore.get(STORAGE_KEYS.COMPANY_ID)?.value || "1";
  const isAdmin = cookieStore.get(STORAGE_KEYS.IS_ADMIN)?.value === "true";

  if (!accessToken || !isTokenValid(accessToken)) {
    throw new AuthenticationError("Session expired");
  }

  if (isAdmin) {
    return { isAdmin: true, permissionMap: new Map() };
  }

  if (!username) {
    throw new AuthenticationError("Authentication required");
  }

  const permissionMap = await fetchUserPermissionMap({
    username,
    companyId,
    token: accessToken,
  });

  return { isAdmin: false, permissionMap };
};
