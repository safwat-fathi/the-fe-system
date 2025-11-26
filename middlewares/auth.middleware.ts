import { NextResponse } from "next/server";

import { ROUTE_RULES, STORAGE_KEYS } from "@/constants";
import { locales, defaultLocale } from "@/i18n/config";
import { MiddlewareFactory } from "@/middleware";
import { isTokenValid } from "@/utilities/token";

const isPublicRoute = (pathname: string) => {
  return ROUTE_RULES.public.some(
    (route) => pathname === route || pathname.startsWith(`${route}/`),
  );
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

const authMiddleware: MiddlewareFactory = (next) => {
  return async (request, event) => {
    const { pathname, search, hash } = request.nextUrl;
    const originalPath = `${pathname}${search}${hash}`;

    const { locale, pathnameWithoutLocale } = getLocaleAndPathname(pathname);
    const isLoginRoute = pathnameWithoutLocale === "/auth/login";

    // Skip authentication for public routes
    if (isPublicRoute(pathnameWithoutLocale)) {
      return next(request, event);
    }

    try {
      // Get the authentication token
      const token = request.cookies.get(STORAGE_KEYS.ACCESS_TOKEN)?.value;
      const hasValidToken = isTokenValid(token);

      if (isLoginRoute) {
        if (hasValidToken) {
          // If token is valid and user is on login page, redirect to localized dashboard/home
          const redirectUrl = new URL(`/${locale}`, request.url);

          return NextResponse.redirect(redirectUrl);
        }

        // If token is not valid, allow access to login page
        return next(request, event);
      }

      if (!hasValidToken) {
        // If token is invalid or missing, redirect to localized login with original path
        const loginUrl = new URL(`/${locale}/auth/login`, request.url);

        loginUrl.searchParams.set("redirect", originalPath);

        const response = NextResponse.redirect(loginUrl);

        // Delete the auth-related cookies on the response
        response.cookies.delete(STORAGE_KEYS.ACCESS_TOKEN);
        response.cookies.delete(STORAGE_KEYS.REFRESH_TOKEN);
        response.cookies.delete(STORAGE_KEYS.CSRF_TOKEN);

        return response;
      }

      // TODO: If user has token - verify it
      // TODO: Add token verification implementation

      // Token exists, allow the request to proceed
      return next(request, event);
    } catch {
      // If there's an error checking auth, redirect to localized login
      // Don't redirect if we're already on the login page
      if (isLoginRoute) {
        return next(request, event);
      }

      const loginUrl = new URL(`/${locale}/auth/login`, request.url);

      loginUrl.searchParams.set("redirect", originalPath);

      return NextResponse.redirect(loginUrl);
    }
  };
};

export default authMiddleware;
