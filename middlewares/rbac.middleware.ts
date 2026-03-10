import { NextResponse } from "next/server";

import { STORAGE_KEYS } from "@/constants";
import { defaultLocale, locales } from "@/i18n/config";
import { MiddlewareFactory } from "@/middleware";
import {
  fetchUserPermissionMap,
  isWildcardAdminPermissionMap,
  isRoutePolicyAuthorized,
  resolveRoutePolicy,
} from "@/utilities/auth/authorization-core";
import { isTokenValid } from "@/utilities/token";
import {
  AuthenticationError,
  AuthorizationError,
} from "@/utilities/errors/Authentication";

const PUBLIC_PATHS = new Set([
  "/",
  "/auth/login",
  "/unauthorized",
  "/register",
  "/forgot-password",
]);

const isApiRoute = (pathname: string) => pathname.startsWith("/api/");

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

const unauthenticatedResponse = (
  request: Request,
  locale: string,
  isApi: boolean,
  redirectPath: string,
) => {
  if (isApi) {
    return NextResponse.json({ message: "Authentication required" }, { status: 401 });
  }

  const loginUrl = new URL(`/${locale}/auth/login`, request.url);

  loginUrl.searchParams.set("redirect", redirectPath);

  return NextResponse.redirect(loginUrl);
};

const unauthorizedResponse = (request: Request, locale: string, isApi: boolean) => {
  if (isApi) {
    return NextResponse.json({ message: "Forbidden" }, { status: 403 });
  }

  const unauthorizedUrl = new URL(`/${locale}/unauthorized`, request.url);

  return NextResponse.redirect(unauthorizedUrl);
};

const rbacMiddleware: MiddlewareFactory = (next) => {
  return async (request, event) => {
    const { pathname, search, hash } = request.nextUrl;
    const redirectPath = `${pathname}${search}${hash}`;
    const isApi = isApiRoute(pathname);

    const { locale, pathnameWithoutLocale } = isApi
      ? { locale: defaultLocale, pathnameWithoutLocale: pathname }
      : getLocaleAndPathname(pathname);

    if (!isApi && PUBLIC_PATHS.has(pathnameWithoutLocale)) {
      return next(request, event);
    }

    const token = request.cookies.get(STORAGE_KEYS.ACCESS_TOKEN)?.value;

    if (!token || !isTokenValid(token)) {
      return unauthenticatedResponse(request, locale, isApi, redirectPath);
    }

    const isAdmin =
      request.cookies.get(STORAGE_KEYS.IS_ADMIN)?.value === "true";

    if (isAdmin) {
      return next(request, event);
    }

    const username = request.cookies.get(STORAGE_KEYS.USERNAME)?.value;
    const companyId = request.cookies.get(STORAGE_KEYS.COMPANY_ID)?.value || "1";

    if (!username) {
      return unauthenticatedResponse(request, locale, isApi, redirectPath);
    }

    try {
      const permissionMap = await fetchUserPermissionMap({
        username,
        companyId,
        token,
      });

      if (isWildcardAdminPermissionMap(permissionMap)) {
        return next(request, event);
      }

      const routePolicy = resolveRoutePolicy(
        pathnameWithoutLocale,
        request.nextUrl.searchParams,
        request.method,
      );

      // Fail-closed: protected route without explicit policy is denied.
      if (!routePolicy) {
        return unauthorizedResponse(request, locale, isApi);
      }

      const canAccess = isRoutePolicyAuthorized(permissionMap, routePolicy);

      if (!canAccess) {
        return unauthorizedResponse(request, locale, isApi);
      }

      return next(request, event);
    } catch (error) {
      if (error instanceof AuthenticationError) {
        return unauthenticatedResponse(request, locale, isApi, redirectPath);
      }

      if (error instanceof AuthorizationError) {
        return unauthorizedResponse(request, locale, isApi);
      }

      return unauthorizedResponse(request, locale, isApi);
    }
  };
};

export default rbacMiddleware;
