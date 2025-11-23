export const locales = ["ar", "en"] as const;

export type Locale = (typeof locales)[number];

export const defaultLocale: Locale = "ar";

export const localeLabels: Record<Locale, string> = {
  ar: "العربية",
  en: "English",
};

export const rtlLocales = new Set<Locale>(["ar"]);

export const getLocaleDir = (locale: Locale): "rtl" | "ltr" =>
  rtlLocales.has(locale) ? "rtl" : "ltr";

export const localePrefix = "always";
