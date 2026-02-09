import type { Voucher } from "@/types/voucher";

import {
  CheckIcon,
  ChevronDoubleLeftIcon,
  ChevronDoubleRightIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  PencilIcon,
  PlusIcon,
  PrinterIcon,
} from "@heroicons/react/24/outline";
import { Button, Checkbox } from "@heroui/react";
import { useLocale, useTranslations } from "next-intl";
import Link from "next/link";
import clsx from "clsx";
import { memo, useMemo } from "react";

import { useRouter } from "@/i18n/navigation";
import { getLocaleDir } from "@/i18n/config";

interface DeliveryHeaderProps {
  voucherTypeName: string;
  voucher: Voucher;
  hasVoucherId: boolean;
  isEditing: boolean;
  searchTerm: string;
  setSearchTerm: (term: string) => void;
  handleSearch: () => void;
  formMode: "new" | "edit" | "preview";
  isLoading: boolean;
  saveVoucher: () => void;
  handleEditClick: () => void;
  isPrinting: boolean;
  printVoucher: () => void;
  navigationMetadata?: {
    firstVoucherHref: string | null;
    prevVoucherHref: string | null;
    nextVoucherHref: string | null;
    lastVoucherHref: string | null;
    totalVouchers?: number | null;
  } | null;
  voucherNumber: string;
}

const DeliveryHeader = ({
  voucherTypeName,
  voucher,
  hasVoucherId,
  isEditing,
  searchTerm,
  setSearchTerm,
  handleSearch,
  formMode,
  isLoading,
  saveVoucher,
  handleEditClick,
  isPrinting,
  printVoucher,
  navigationMetadata,
  voucherNumber,
}: DeliveryHeaderProps) => {
  const t = useTranslations("forms.customerGoldVoucher");
  const router = useRouter();
  const tCommon = useTranslations("common");
  const locale = useLocale();
  const dir = getLocaleDir(locale as "ar" | "en");
  const textAlign = dir === "rtl" ? "text-right" : "text-left";

  const formattedDate = useMemo(() => {
    return new Date(voucher.vouch_date).toLocaleString("en-US", {
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
      hour12: true,
    });
  }, [voucher.vouch_date]);

  return (
    <div className="bg-gradient-to-r from-slate-50 to-gray-50 rounded-lg p-1.5 mb-1 border border-slate-200">
      <div className="flex items-center justify-between mb-1">
        <div className="flex items-center gap-2">
          <h1 className="text-lg font-bold text-slate-800 flex items-center gap-2">
            <span>{voucherTypeName}</span>
            <span className="text-slate-600 font-medium">
              #{hasVoucherId ? voucher.vouch_id : t("messages.numbering")}
            </span>
            <span className="text-sm text-slate-600 font-medium flex items-center gap-1">
              <i className="bi bi-calendar3 w-4 h-4 text-slate-500" />
              {formattedDate}
            </span>
          </h1>
        </div>

        {/* البحث */}
        <div className="flex items-center gap-2">
          <input
            className="w-32 h-7 text-xs border border-slate-300 rounded-md focus:border-slate-500 focus:ring-1 focus:ring-slate-500 px-2"
            placeholder={t("messages.searchPlaceholder")}
            type="number"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                handleSearch();
              }
            }}
          />
          <button
            className="h-7 px-2 text-xs bg-slate-600 text-white hover:bg-slate-700 border border-slate-600 rounded-md shadow-sm"
            onClick={handleSearch}
          >
            <i className="bi bi-search w-4 h-4" />
          </button>
        </div>
      </div>

      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2 flex-wrap">
          <Button
            className="h-7 px-3 text-xs bg-emerald-600 text-white hover:bg-emerald-700 border border-emerald-600 rounded-md shadow-sm"
            isDisabled={!isEditing}
            isLoading={isLoading}
            startContent={
              !isLoading ? <CheckIcon className="w-4 h-4" /> : undefined
            }
            variant="solid"
            onPress={saveVoucher}
          >
            {t("buttons.save")}
          </Button>

          <Button
            className="h-7 px-3 text-xs bg-slate-100 text-slate-700 hover:bg-slate-200 border border-slate-300 rounded-md shadow-sm"
            isDisabled={formMode === "new" || isEditing || isLoading}
            startContent={<PencilIcon className="w-4 h-4 text-slate-500" />}
            variant="solid"
            onPress={handleEditClick}
          >
            {t("buttons.edit")}
          </Button>

          <Button
            className="h-7 px-3 text-xs bg-blue-600 text-white hover:bg-blue-700 border border-blue-600 rounded-md shadow-sm"
            startContent={<PlusIcon className="w-4 h-4" />}
            variant="solid"
            onPress={() => router.push("/forms/delivery")}
          >
            {t("buttons.new")}
          </Button>

          <Button
            className="h-7 px-3 text-xs bg-slate-600 text-white hover:bg-slate-700 border border-slate-600 rounded-md shadow-sm"
            isDisabled={!hasVoucherId}
            isLoading={isPrinting}
            startContent={
              !isPrinting ? <PrinterIcon className="w-4 h-4" /> : undefined
            }
            variant="solid"
            onPress={printVoucher}
          >
            {t("buttons.print")}
          </Button>

          {/* أزرار التنقل - مثل الفواتير - ظاهرة دائماً */}
          {navigationMetadata && (
            <div className="hidden md:flex items-center gap-1 mr-2">
              <Link
                className={clsx(
                  "flex items-center justify-center h-7 w-12 text-xs bg-slate-100 text-slate-700 hover:bg-slate-200 border border-slate-300 rounded-md shadow-sm",
                  {
                    "pointer-events-none opacity-40":
                      !navigationMetadata?.firstVoucherHref,
                  },
                )}
                href={navigationMetadata?.firstVoucherHref || ""}
              >
                <ChevronDoubleRightIcon className="w-4 h-4" />
              </Link>
              <Link
                className={clsx(
                  "flex items-center justify-center h-7 w-12 text-xs bg-slate-100 text-slate-700 hover:bg-slate-200 border border-slate-300 rounded-md shadow-sm",
                  {
                    "pointer-events-none opacity-40":
                      !navigationMetadata?.prevVoucherHref,
                  },
                )}
                href={navigationMetadata?.prevVoucherHref || ""}
              >
                <ChevronRightIcon className="w-4 h-4" />
              </Link>
              <span
                className={`text-xs text-slate-600 px-2 font-medium ${textAlign}`}
              >
                {tCommon("navigation.position", {
                  current: voucherNumber,
                  total: navigationMetadata?.totalVouchers ?? "?",
                })}
              </span>
              <Link
                className={clsx(
                  "flex items-center justify-center h-7 w-12 text-xs bg-slate-100 text-slate-700 hover:bg-slate-200 border border-slate-300 rounded-md shadow-sm",
                  {
                    "pointer-events-none opacity-40":
                      !navigationMetadata?.nextVoucherHref,
                  },
                )}
                href={navigationMetadata?.nextVoucherHref || ""}
              >
                <ChevronLeftIcon className="w-4 h-4" />
              </Link>
              <Link
                className={clsx(
                  "flex items-center justify-center h-7 w-12 text-xs bg-slate-100 text-slate-700 hover:bg-slate-200 border border-slate-300 rounded-md shadow-sm",
                  {
                    "pointer-events-none opacity-40":
                      !navigationMetadata?.lastVoucherHref,
                  },
                )}
                href={navigationMetadata?.lastVoucherHref || ""}
              >
                <ChevronDoubleLeftIcon className="w-4 h-4" />
              </Link>
            </div>
          )}
        </div>

        <div className="flex items-center gap-2 sm:gap-3">
          <div className="flex items-center gap-1">
            <Checkbox
              color="success"
              isDisabled
              isSelected={voucher.commit}
              size="sm"
            />
            <span className="text-xs text-slate-600">{t("status.saved")}</span>
          </div>

          <div className="flex items-center gap-1">
            <Checkbox
              color="warning"
              isDisabled
              isSelected={voucher.post}
              size="sm"
            />
            <span className="text-xs text-slate-600">{t("status.posted")}</span>
          </div>

          <div className="flex items-center gap-1">
            <Checkbox
              color="warning"
              isDisabled
              isSelected={voucher.print}
              size="sm"
            />
            <span className="text-xs text-slate-600">
              {t("status.printed")}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default memo(DeliveryHeader);
