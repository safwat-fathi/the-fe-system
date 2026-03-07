import { NextResponse } from "next/server";

import { STORAGE_KEYS } from "@/constants";
import { defaultLocale, locales } from "@/i18n/config";
import { MiddlewareFactory } from "@/middleware";

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

type PermissionMap = Map<string, Set<string>>;

const PUBLIC_PATHS = new Set(["/", "/unauthorized"]);

const parsePermissions = (permissions: BackendPermission[]): PermissionMap => {
  const map: PermissionMap = new Map();

  for (const perm of permissions) {
    if (!perm.priv_status || !perm.obj_source) continue;

    const sources = perm.obj_source.split(",").map((s) => s.trim());

    for (const source of sources) {
      const lastDot = source.lastIndexOf(".");

      if (lastDot === -1) continue;

      const resourceKey = source.substring(0, lastDot);
      const action = source.substring(lastDot + 1);

      if (!map.has(resourceKey)) {
        map.set(resourceKey, new Set());
      }

      map.get(resourceKey)!.add(action);
    }
  }

  return map;
};

const getUserPermissions = async (
  username: string,
  companyId: string,
  token: string,
): Promise<PermissionMap> => {
  try {
    const baseUrl = process.env.NEXT_PUBLIC_API_BASE_URL;

    if (!baseUrl) {
      throw new Error("NEXT_PUBLIC_API_BASE_URL is not defined");
    }

    const fetchUrl = `${baseUrl}/user_object_permissions?username=${username}&com=${companyId}`;

    const response = await fetch(fetchUrl, {
      headers: {
        Authorization: `Bearer ${token.replace(/['"]+/g, "")}`,
        Accept: "application/json",
      },
      next: { revalidate: 300, tags: [`user-permissions-${username}`] },
    });

    if (!response.ok) {
      return new Map();
    }

    const json = await response.json();

    if (!json.permissions || !Array.isArray(json.permissions)) {
      return new Map();
    }

    return parsePermissions(json.permissions);
  } catch (error) {
    console.error("Error fetching user permissions:", error);

    return new Map();
  }
};

const derivePermission = (
  pathnameWithoutLocale: string,
): { resourceKey: string; action: string } | null => {
  const segments = pathnameWithoutLocale.split("/").filter(Boolean);

  if (segments.length < 2) return null;

  const parent = segments[0];
  const resource = segments[1];
  const resourceKey = `${parent}.${resource}`;

  if (segments.length === 2) {
    return { resourceKey, action: "view" };
  }

  const third = segments[2];

  if (third === "new") {
    return { resourceKey, action: "create" };
  }

  return { resourceKey, action: "update" };
};

const hasPermission = (
  permissionMap: PermissionMap,
  resourceKey: string,
  requiredAction: string,
): boolean => {
  const actions = permissionMap.get(resourceKey);

  if (!actions) return false;

  if (actions.has(requiredAction)) return true;

  if (requiredAction === "view") return actions.size > 0;

  return false;
};

const getLocaleAndPathname = (pathname: string) => {
  const segments = pathname.split("/").filter(Boolean);

  if (segments.length === 0) {
    return {
      locale: defaultLocale,
      pathnameWithoutLocale: "/",
    };
  }

  const potentialLocale = segments[0];
  const hasLocale = locales.includes(
    potentialLocale as (typeof locales)[number],
  );

  const locale = hasLocale ? potentialLocale : defaultLocale;
  const remainingSegments = hasLocale ? segments.slice(1) : segments;

  const pathnameWithoutLocale =
    remainingSegments.length > 0 ? `/${remainingSegments.join("/")}` : "/";

  return {
    locale,
    pathnameWithoutLocale,
  };
};

const rbacMiddleware: MiddlewareFactory = (next) => {
  return async (request, event) => {
    const { pathname } = request.nextUrl;
    const { locale, pathnameWithoutLocale } = getLocaleAndPathname(pathname);

    if (PUBLIC_PATHS.has(pathnameWithoutLocale)) {
      return next(request, event);
    }

    const isAdmin =
      request.cookies.get(STORAGE_KEYS.IS_ADMIN)?.value === "true";

    if (isAdmin) {
      return next(request, event);
    }

    try {
      const userData = request.cookies.get(STORAGE_KEYS.USER_DATA)?.value;
      let username = null;

      if (userData) {
        try {
          const parsedUserData = JSON.parse(decodeURIComponent(userData));

          username = parsedUserData.username || parsedUserData.email;
        } catch (error) {
          console.error("Error parsing user data:", error);
        }
      }

      const usernameCookie = request.cookies.get(STORAGE_KEYS.USERNAME)?.value;
      const companyIdCookie = request.cookies.get(
        STORAGE_KEYS.COMPANY_ID,
      )?.value;
      const tokenCookie = request.cookies.get(STORAGE_KEYS.ACCESS_TOKEN)?.value;

      const computedUsername = usernameCookie || username;

      if (!computedUsername || !tokenCookie) {
        return next(request, event);
      }

      const derived = derivePermission(pathnameWithoutLocale);

      if (!derived) {
        return next(request, event);
      }

      const permissionMap = await getUserPermissions(
        computedUsername,
        companyIdCookie || "1",
        tokenCookie,
      );

      const hasAccess = hasPermission(
        permissionMap,
        derived.resourceKey,
        derived.action,
      );

      if (!hasAccess) {
        const unauthorizedUrl = new URL(`/${locale}/unauthorized`, request.url);

        return NextResponse.redirect(unauthorizedUrl);
      }

      return next(request, event);
    } catch (error) {
      console.error("Error in RBAC middleware:", error);

      return next(request, event);
    }
  };
};

export default rbacMiddleware;
