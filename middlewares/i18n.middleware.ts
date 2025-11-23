import { NextResponse } from "next/server";
import createIntlMiddleware from "next-intl/middleware";

import { defaultLocale, localePrefix, locales } from "@/i18n/config";
import { MiddlewareFactory } from "@/middleware";

const intlMiddleware = createIntlMiddleware({
  locales,
  defaultLocale,
  localePrefix,
});

const i18nMiddleware: MiddlewareFactory = (next) => {
  return (request, event) => {
    const response = intlMiddleware(request);
    const shouldContinue =
      response?.headers?.get("x-middleware-next") === "1" &&
      !response.headers.has("location");

    if (shouldContinue) {
      return next(request, event);
    }

    return response ?? NextResponse.next();
  };
};

export default i18nMiddleware;
