"use client";

import { usePathname } from "next/navigation";
import { useLocale } from "next-intl";
import clsx from "clsx";

import { Locale, localeLabels, locales } from "@/i18n/config";

export default function ChangeLocale() {
  const pathname = usePathname(); // current path with locale prefix
  const currentLocale = useLocale() as Locale; // current locale

  function switchLocale(nextLocale: string) {
    if (nextLocale === currentLocale) return;

    const segments = pathname.split("/").filter(Boolean);
    let restPath: string;

    if (segments.length === 0) {
      restPath = "";
    } else if (locales.includes(segments[0] as Locale)) {
      // replace existing locale segment
      restPath = segments.slice(1).join("/");
    } else {
      // no locale prefix yet, keep full path as rest
      restPath = segments.join("/");
    }

    const restSegment = restPath ? "/" + restPath : "";
    const newPath = `/${nextLocale}${restSegment}`;

    if (typeof window !== "undefined") {
      window.location.href =
        newPath + window.location.search + window.location.hash;
    }
  }

  return (
    <div className="flex gap-2">
      {locales.map((locale) => (
        <button
          key={locale}
          onClick={() => switchLocale(locale)}
          className={clsx({
            "font-bold underline pointer-events-none cursor-default":
              currentLocale === locale,
          })}
        >
          {localeLabels[locale]}
        </button>
      ))}
    </div>
  );
}
