"use client";

import {
  Button,
  Dropdown,
  DropdownItem,
  DropdownMenu,
  DropdownTrigger,
} from "@heroui/react";
import { LanguageIcon } from "@heroicons/react/24/outline";
import { usePathname } from "next/navigation";
import { useLocale } from "next-intl";
import clsx from "clsx";

import { Locale, localeLabels, locales } from "@/i18n/config";

export default function ChangeLocale() {
  const pathname = usePathname();
  const currentLocale = useLocale() as Locale;

  function switchLocale(nextLocale: string) {
    if (nextLocale === currentLocale) return;

    const segments = pathname.split("/").filter(Boolean);
    let restPath: string;

    if (segments.length === 0) {
      restPath = "";
    } else if (locales.includes(segments[0] as Locale)) {
      restPath = segments.slice(1).join("/");
    } else {
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
    <Dropdown placement="top" className="min-w-0">
      <DropdownTrigger>
        <Button
          isIconOnly
          aria-label="تغيير اللغة / Change language"
          className={clsx(
            "rounded-full bg-gray-100 border border-gray-200",
            "hover:bg-gray-200 hover:border-gray-300 hover:shadow-sm",
            "text-slate-600 hover:text-slate-800 transition-all duration-200",
          )}
          variant="flat"
        >
          <LanguageIcon className="h-5 w-5" />
        </Button>
      </DropdownTrigger>
      <DropdownMenu
        aria-label="اختر اللغة"
        selectedKeys={[currentLocale]}
        selectionMode="single"
        className="min-w-[140px]"
      >
        {locales.map((locale) => (
          <DropdownItem
            key={locale}
            className="text-sm"
            onPress={() => switchLocale(locale)}
          >
            {localeLabels[locale]}
          </DropdownItem>
        ))}
      </DropdownMenu>
    </Dropdown>
  );
}
