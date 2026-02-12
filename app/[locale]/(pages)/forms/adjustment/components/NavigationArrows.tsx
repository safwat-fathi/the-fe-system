import {
  ChevronDoubleLeftIcon,
  ChevronDoubleRightIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
} from "@heroicons/react/24/outline";
import { useTranslations, useLocale } from "next-intl";
import Link from "next/link";
import clsx from "clsx";

import { getLocaleDir } from "@/i18n/config";

export interface NavigationArrowsProps {
  voucherNumber: string;
  navigationMetadata: {
    firstVoucherHref: string | null;
    prevVoucherHref: string | null;
    nextVoucherHref: string | null;
    lastVoucherHref: string | null;
    totalVouchers?: number | null;
  } | null;
}

const NavigationArrows = ({
  voucherNumber,
  navigationMetadata,
}: NavigationArrowsProps) => {
  const t = useTranslations("forms.adjustment");
  const locale = useLocale();
  const dir = getLocaleDir(locale as "ar" | "en");
  const textAlign = dir === "rtl" ? "text-right" : "text-left";

  if (!navigationMetadata) {
    return null;
  }

  return (
    <div className="hidden md:flex items-center gap-1 mr-2">
      <Link
        className={clsx(
          "flex items-center justify-center h-7 w-8 text-xs bg-slate-100 text-slate-700 hover:bg-slate-200 border border-slate-300 rounded-md shadow-sm",
          {
            "pointer-events-none opacity-40":
              !navigationMetadata?.firstVoucherHref,
          },
        )}
        href={navigationMetadata.firstVoucherHref || ""}
      >
        <ChevronDoubleRightIcon className="w-3 h-3" />
      </Link>
      <Link
        className={clsx(
          "flex items-center justify-center h-7 w-8 text-xs bg-slate-100 text-slate-700 hover:bg-slate-200 border border-slate-300 rounded-md shadow-sm",
          {
            "pointer-events-none opacity-40":
              !navigationMetadata?.prevVoucherHref,
          },
        )}
        href={navigationMetadata.prevVoucherHref || ""}
      >
        <ChevronRightIcon className="w-3 h-3" />
      </Link>
      <span
        className={`text-xs text-slate-600 px-0.5 font-medium ${textAlign}`}
      >
        {t("navigation.position", {
          current: voucherNumber,
          total: navigationMetadata?.totalVouchers ?? "?",
        })}
      </span>
      <Link
        className={clsx(
          "flex items-center justify-center h-7 w-8 text-xs bg-slate-100 text-slate-700 hover:bg-slate-200 border border-slate-300 rounded-md shadow-sm",
          {
            "pointer-events-none opacity-40":
              !navigationMetadata?.nextVoucherHref,
          },
        )}
        href={navigationMetadata.nextVoucherHref || ""}
      >
        <ChevronLeftIcon className="w-3 h-3" />
      </Link>
      <Link
        className={clsx(
          "flex items-center justify-center h-7 w-8 text-xs bg-slate-100 text-slate-700 hover:bg-slate-200 border border-slate-300 rounded-md shadow-sm",
          {
            "pointer-events-none opacity-40":
              !navigationMetadata?.lastVoucherHref,
          },
        )}
        href={navigationMetadata.lastVoucherHref || ""}
      >
        <ChevronDoubleLeftIcon className="w-3 h-3" />
      </Link>
    </div>
  );
};

export default NavigationArrows;
