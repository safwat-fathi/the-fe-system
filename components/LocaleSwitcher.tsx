"use client";

import { useMemo } from "react";
import {
  Button,
  Dropdown,
  DropdownItem,
  DropdownMenu,
  DropdownTrigger,
} from "@heroui/react";
import { ChevronDownIcon } from "@heroicons/react/24/outline";
import { useLocale } from "next-intl";

import { Locale, localeLabels, locales } from "@/i18n/config";
import { usePathname } from "@/i18n/navigation";

const LocaleSwitcher = () => {
  const currentLocale = useLocale() as Locale;
  const pathname = usePathname();

  const currentLabel = useMemo(
    () => localeLabels[currentLocale] ?? currentLocale.toUpperCase(),
    [currentLocale],
  );

  const handleChange = (nextLocale: Locale) => {
    if (nextLocale === currentLocale) return;

    const segments = pathname.split("/").filter(Boolean);
    let restPath = "";

    if (segments.length === 0) {
      restPath = "";
    } else if (locales.includes(segments[0] as Locale)) {
      // replace existing locale segment
      restPath = segments.slice(1).join("/");
    } else {
      // no locale prefix yet, keep full path as rest
      restPath = segments.join("/");
    }

    const newPath = `/${nextLocale}${restPath ? `/${restPath}` : ""}`;

    if (typeof window !== "undefined") {
      window.location.href =
        newPath + window.location.search + window.location.hash;
    }
  };

  return (
    <Dropdown placement="bottom-end">
      <DropdownTrigger>
        <Button
          className="flex items-center gap-1 min-w-[120px] justify-between"
          variant="bordered"
        >
          <span className="text-sm font-medium">{currentLabel}</span>
          <ChevronDownIcon className="h-4 w-4 text-slate-500" />
        </Button>
      </DropdownTrigger>
      <DropdownMenu
        aria-label="اختر اللغة"
        selectedKeys={[currentLocale]}
        selectionMode="single"
      >
        {locales.map((locale) => (
          <DropdownItem
            key={locale}
            className="text-sm"
            onPress={() => handleChange(locale)}
          >
            {localeLabels[locale]}
          </DropdownItem>
        ))}
      </DropdownMenu>
    </Dropdown>
  );
};

export default LocaleSwitcher;
