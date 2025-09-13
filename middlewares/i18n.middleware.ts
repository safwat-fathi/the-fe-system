import { MiddlewareFactory } from "@/middleware";
import { createI18nMiddleware } from "next-international/middleware";
import { NextRequest } from "next/server";

const LOCALES = ["ar", "en"];
const DEFAULT_LOCALE = "ar";

const I18nMiddleware = createI18nMiddleware({
  locales: LOCALES,
  defaultLocale: DEFAULT_LOCALE,
});

const i18nMiddleware: MiddlewareFactory = () => {
  return async (request: NextRequest) => {
    return I18nMiddleware(request);
  };
};

export default i18nMiddleware;
