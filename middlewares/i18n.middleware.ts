import { NextRequest, NextResponse } from "next/server";
import createIntlMiddleware from "next-intl/middleware";

import { defaultLocale, localePrefix, locales } from "@/i18n/config";
import { MiddlewareFactory } from "@/middleware";

const intlMiddleware = createIntlMiddleware({
  locales,
  defaultLocale,
  localePrefix,
});

const i18nMiddleware: MiddlewareFactory = (next) => {
  return async (request, event) => {
    if (request.nextUrl.pathname.startsWith("/api/")) {
      return next(request, event);
    }

    const response = intlMiddleware(request);

    const requestHeaders = new Headers(request.headers);

    response.headers.forEach((value, key) => {
      if (key.startsWith("x-middleware-request-")) {
        requestHeaders.set(key, value);
      }
    });

    const nextRequest = new NextRequest(request.url, {
      headers: requestHeaders,
    });

    response.cookies.getAll().forEach((cookie) => {
      nextRequest.cookies.set(cookie.name, cookie.value);
    });

    const isRedirect =
      response.status === 307 ||
      response.status === 308 ||
      response.headers.has("location");

    if (isRedirect) {
      return response;
    }

    const nextResponse = await next(nextRequest, event);

    if (
      nextResponse &&
      (nextResponse.status === 307 ||
        nextResponse.status === 308 ||
        nextResponse.headers.has("location"))
    ) {
      return nextResponse;
    }

    if (nextResponse) {
      const nextRes = nextResponse as NextResponse;
      const originalRes = response as NextResponse;

      nextRes.cookies.getAll().forEach((cookie: any) => {
        originalRes.cookies.set(cookie.name, cookie.value);
      });
    }

    return response;
  };
};

export default i18nMiddleware;
