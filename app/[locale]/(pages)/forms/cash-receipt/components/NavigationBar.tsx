import Link from "next/link";
import clsx from "clsx";
import {
  ChevronDoubleLeftIcon,
  ChevronDoubleRightIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
} from "@heroicons/react/24/outline";
import { useTranslations } from "next-intl";
import { useMemo } from "react";

import navigationMetadata from "../utilities/navigationMetadata";

const NavigationBar = ({
  voucherNumber,
  textAlign,
  navigationInfo,
}: {
  voucherNumber: string | number;
  textAlign: string;
  navigationInfo: {
    next: number | null;
    previous: number | null;
    last: number | null;
    first: number | null;
    vouchersCount: number | null;
  };
}) => {
  const t = useTranslations("forms.cashReceipt");

  const navigationMetadataClient = useMemo(() => {
    return navigationMetadata(navigationInfo);
  }, [navigationInfo]);

  return (
    <div className="hidden md:flex items-center gap-0.5">
      <Link
        className={clsx(
          "flex items-center justify-center h-7 w-8 text-xs bg-slate-100 text-slate-700 hover:bg-slate-200 border border-slate-300 rounded-md shadow-sm",
          {
            "pointer-events-none opacity-40":
              !navigationMetadataClient?.firstVoucherHref,
          },
        )}
        href={navigationMetadataClient?.firstVoucherHref || ""}
      >
        <ChevronDoubleRightIcon className="w-3 h-3" />
      </Link>
      <Link
        className={clsx(
          "flex items-center justify-center h-7 w-8 text-xs bg-slate-100 text-slate-700 hover:bg-slate-200 border border-slate-300 rounded-md shadow-sm",
          {
            "pointer-events-none opacity-40":
              !navigationMetadataClient?.prevVoucherHref,
          },
        )}
        href={navigationMetadataClient?.prevVoucherHref || ""}
      >
        <ChevronRightIcon className="w-3 h-3" />
      </Link>
      <span
        className={`text-xs text-slate-600 px-0.5 font-medium ${textAlign}`}
      >
        {t("navigation.position", {
          current: voucherNumber,
          total: navigationMetadataClient?.totalVouchers ?? "?",
        })}
      </span>
      <Link
        className={clsx(
          "flex items-center justify-center h-7 w-8 text-xs bg-slate-100 text-slate-700 hover:bg-slate-200 border border-slate-300 rounded-md shadow-sm",
          {
            "pointer-events-none opacity-40":
              !navigationMetadataClient?.nextVoucherHref,
          },
        )}
        href={navigationMetadataClient?.nextVoucherHref || ""}
      >
        <ChevronLeftIcon className="w-3 h-3" />
      </Link>
      <Link
        className={clsx(
          "flex items-center justify-center h-7 w-8 text-xs bg-slate-100 text-slate-700 hover:bg-slate-200 border border-slate-300 rounded-md shadow-sm",
          {
            "pointer-events-none opacity-40":
              !navigationMetadataClient?.lastVoucherHref,
          },
        )}
        href={navigationMetadataClient?.lastVoucherHref || ""}
      >
        <ChevronDoubleLeftIcon className="w-3 h-3" />
      </Link>
    </div>
  );
};

export default NavigationBar;
