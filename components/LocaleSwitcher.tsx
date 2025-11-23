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
import { useSearchParams } from "next/navigation";

import { Locale, localeLabels, locales } from "@/i18n/config";
import { usePathname, useRouter } from "@/i18n/navigation";

const LocaleSwitcher = () => {
  const currentLocale = useLocale() as Locale;
  const pathname = usePathname();
  const router = useRouter();
  const searchParams = useSearchParams();

  const currentLabel = useMemo(
    () => localeLabels[currentLocale] ?? currentLocale.toUpperCase(),
    [currentLocale],
  );

  const buildHref = () => {
    const search = searchParams?.toString();
    const query = search ? `?${search}` : "";
    const hash = typeof window !== "undefined" ? window.location.hash : "";

    return `${pathname}${query}${hash}`;
  };

  const handleChange = (nextLocale: Locale) => {
    if (nextLocale === currentLocale) return;

    router.replace(buildHref(), {
      locale: nextLocale,
      scroll: false,
    });
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
            onPress={() => handleChange(locale)}
            className="text-sm"
          >
            {localeLabels[locale]}
          </DropdownItem>
        ))}
      </DropdownMenu>
    </Dropdown>
  );
};

export default LocaleSwitcher;
