"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { Button, Checkbox } from "@heroui/react";
import clsx from "clsx";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import {
  CalendarIcon,
  CheckCircleIcon,
  ChevronDoubleLeftIcon,
  ChevronDoubleRightIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  PencilIcon,
  PlusCircleIcon,
  PrinterIcon,
} from "@heroicons/react/24/outline";

import { SearchIcon } from "../../../../../../components/icons";

import { useInvoiceTotalsStore } from "@/stores/invoiceTotalsStore";

export default function InvoiceTotalsActions() {
  const router = useRouter();
  const t = useTranslations("forms.invoices.actions");
  const {
    metadata,
    invoiceNumber,
    maxInvoiceId,
    formattedDateTime,
    saveInvoice,
    previewInvoice,
    invoiceDate,
    setInvoiceDate,
    commit,
    setCommit,
    print,
    setPrint,
    isOk,
    isDone,
    isEditing,
    onEdit,
    searchNumber,
    setSearchNumber,
    onInvoiceSearch,
    newInvoiceHref,
    isNewInvoice,
  } = useInvoiceTotalsStore();
  const [isDateEditing, setIsDateEditing] = useState(false);

  useEffect(() => {
    if (!isEditing) {
      setIsDateEditing(false);
    }
  }, [isEditing]);

  const toLocalDateTimeInputValue = useCallback((value?: string) => {
    if (!value) return "";
    const parsed = new Date(value);

    if (Number.isNaN(parsed.getTime())) return "";
    const local = new Date(
      parsed.getTime() - parsed.getTimezoneOffset() * 60 * 1000,
    );

    return local.toISOString().slice(0, 16);
  }, []);

  const displayDate = useMemo(() => {
    if (formattedDateTime && formattedDateTime.trim().length > 0) {
      return formattedDateTime;
    }
    const fallback = toLocalDateTimeInputValue(invoiceDate);

    return fallback ? fallback.replace("T", " ") : "—";
  }, [formattedDateTime, invoiceDate, toLocalDateTimeInputValue]);

  const handleInvoiceDateChange = (value: string) => {
    const iso = value ? new Date(value).toISOString() : "";

    setInvoiceDate(iso);
    setIsDateEditing(false);
  };

  const dateDisplayElement = useMemo(() => {
    if (!isEditing) {
      return displayDate;
    }

    if (isDateEditing) {
      return (
        <input
          className="h-7 border px-2 rounded text-xs sm:text-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500 bg-white"
          type="datetime-local"
          value={toLocalDateTimeInputValue(invoiceDate)}
          onBlur={() => setIsDateEditing(false)}
          onChange={(e) => handleInvoiceDateChange(e.target.value)}
        />
      );
    }

    return (
      <button
        className="h-7 px-2 rounded text-xs sm:text-sm hover:bg-gray-50 border border-transparent text-right"
        type="button"
        onClick={() => setIsDateEditing(true)}
      >
        {displayDate}
      </button>
    );
  }, [
    isEditing,
    isDateEditing,
    displayDate,
    invoiceDate,
    toLocalDateTimeInputValue,
  ]);

  const currentInvoiceNumber = useMemo(() => {
    if (invoiceNumber) return invoiceNumber;
    if (maxInvoiceId) return maxInvoiceId + 1;

    return "";
  }, [invoiceNumber, maxInvoiceId]);

  return (
    <div className="relative bg-gradient-to-r from-slate-50 to-gray-50 rounded-lg p-2 sm:p-3 mb-3 sm:mb-4 border border-slate-200">
      <div className="absolute ltr:right-0 rtl:left-0 -top-[50px] flex items-center gap-3">
        {currentInvoiceNumber && (
          <span className="text-slate-600 font-medium text-sm sm:text-base">
            #{currentInvoiceNumber}
          </span>
        )}
        <div className="flex items-center gap-1 text-sm text-slate-600 font-medium">
          <CalendarIcon className="w-4 h-4 text-slate-500" />
          {dateDisplayElement}
        </div>
      </div>
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 sm:gap-3">
        {/* <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2">
          <div>
            <h1 className="text-lg sm:text-xl font-bold text-slate-800 flex flex-col sm:flex-row items-start sm:items-center gap-1 sm:gap-4 mb-2">
              <span>فاتورة {invoiceTitle}</span>
              <span className="text-slate-600 font-medium text-sm sm:text-base">
                #{invoiceNumber}
              </span>
              <div className="flex items-center gap-1 text-sm text-slate-600 font-medium">
                <CalendarIcon className="w-4 h-4 text-slate-500" />
                {formattedDateTime}
              </div>
            </h1>
          </div>
        </div> */}
        {/* الأزرار من اليسار لليمين */}
        <div className="flex flex-wrap items-center gap-1 ">
          {isEditing && (
            <Button
              className="h-7 px-3 text-xs bg-emerald-600 text-white hover:bg-emerald-700 border border-emerald-600 rounded-md shadow-sm"
              onClick={saveInvoice}
            >
              <CheckCircleIcon className="w-4 h-4 " />
              <span className="hidden sm:inline">{t("save")}</span>
            </Button>
          )}

          {!isEditing && (
            <Button
              className="h-7 px-3 text-xs bg-slate-100 text-slate-700 hover:bg-slate-200 border border-slate-300 rounded-md shadow-sm"
              onClick={onEdit}
            >
              <PencilIcon className="w-4 h-4 text-slate-500" />
              <span className="hidden sm:inline">{t("edit")}</span>
            </Button>
          )}

          <Button
            className="h-7 px-3 text-xs bg-blue-600 text-white hover:bg-blue-700 border border-blue-600 rounded-md shadow-sm"
            onClick={() => router.push(newInvoiceHref)}
          >
            <PlusCircleIcon className="w-4 h-4 " />
            <span className="hidden sm:inline">{t("new")}</span>
          </Button>

          {!isNewInvoice && (
            <Button
              className="h-7 px-3 text-xs bg-slate-600 text-white hover:bg-slate-700 border border-slate-600 rounded-md shadow-sm"
              onClick={previewInvoice}
            >
              <PrinterIcon className="w-4 h-4 " />
              <span className="hidden sm:inline">{t("print")}</span>
            </Button>
          )}

          {/* أزرار التنقل */}

          {metadata && (
            <div className="hidden md:flex items-center gap-1 mr-2">
              <Link
                className={clsx(
                  "flex items-center justify-center h-7 w-12 text-xs bg-slate-100 text-slate-700 hover:bg-slate-200 border border-slate-300 rounded-md shadow-sm",
                  {
                    "pointer-events-none opacity-40 ":
                      !metadata.firstInvoiceHref,
                  },
                )}
                // onClick={(e) => handleLinkClick(e, metadata.firstInvoiceHref)}
                href={metadata.firstInvoiceHref || ""}

                // onClick={() => navigateToInvoice("first")}
              >
                <ChevronDoubleRightIcon className="w-4 h-4 " />
              </Link>
              <Link
                className={clsx(
                  "flex items-center justify-center h-7 w-12 text-xs bg-slate-100 text-slate-700 hover:bg-slate-200 border border-slate-300 rounded-md shadow-sm",
                  {
                    "pointer-events-none opacity-40 ":
                      !metadata.prevInvoiceHref,
                  },
                )}
                // onClick={(e) => handleLinkClick(e, metadata.prevInvoiceHref)}
                href={metadata.prevInvoiceHref || ""}

                // onClick={() => navigateToInvoice("prev")}
              >
                <ChevronRightIcon className="w-4 h-4 " />
              </Link>
              <span className="text-xs text-slate-600 px-2 font-medium">
                {t("invoicePosition", {
                  current: invoiceNumber,
                  total: metadata.totalInvoices ?? "-",
                })}
              </span>
              <Link
                className={clsx(
                  "flex items-center justify-center h-7 w-12 text-xs bg-slate-100 text-slate-700 hover:bg-slate-200 border border-slate-300 rounded-md shadow-sm",
                  {
                    "pointer-events-none opacity-40 ":
                      !metadata.nextInvoiceHref,
                  },
                )}
                // onClick={(e) => handleLinkClick(e, metadata.nextInvoiceHref)}
                href={metadata.nextInvoiceHref || ""}

                // onClick={() => navigateToInvoice("next")}
              >
                <ChevronLeftIcon className="w-4 h-4 " />
              </Link>
              <Link
                className={clsx(
                  "flex items-center justify-center h-7 w-12 text-xs bg-slate-100 text-slate-700 hover:bg-slate-200 border border-slate-300 rounded-md shadow-sm",
                  {
                    "pointer-events-none opacity-40 ":
                      !metadata.lastInvoiceHref,
                  },
                )}
                // onClick={(e) => handleLinkClick(e, metadata.lastInvoiceHref)}
                href={metadata.lastInvoiceHref || ""}

                // onClick={() => navigateToInvoice("last")}
              >
                <ChevronDoubleLeftIcon className="w-4 h-4 " />
              </Link>
            </div>
          )}
        </div>

        <div className="flex items-center gap-2 sm:gap-3">
          <div className="flex items-center gap-1">
            <Checkbox
              isReadOnly={!isEditing}
              isSelected={commit}
              size="sm"
              onValueChange={setCommit}
            />
            <span className="text-xs text-slate-600">
              {t("status.committed")}
            </span>
          </div>

          <div className="flex items-center gap-1">
            <Checkbox
              color="danger"
              isReadOnly={!isEditing}
              isSelected={print}
              size="sm"
              onValueChange={setPrint}
            />
            <span className="text-xs text-slate-600">
              {t("status.printed")}
            </span>
          </div>

          <div className="flex items-center gap-1">
            <Checkbox
              isReadOnly
              classNames={{
                wrapper: isOk ? "bg-success-500 border-success-500" : undefined,
              }}
              isSelected={isOk ?? false}
              size="sm"
            />
            <span className="text-xs text-slate-600">{t("status.ok")}</span>
          </div>

          <div className="flex items-center gap-1">
            <Checkbox
              isReadOnly
              classNames={{
                wrapper: isDone
                  ? "bg-success-500 border-success-500"
                  : undefined,
              }}
              isSelected={isDone ?? false}
              size="sm"
            />
            <span className="text-xs text-slate-600">{t("status.done")}</span>
          </div>
        </div>

        {/* البحث */}
        <div className="flex items-center gap-1 sm:gap-2 w-full sm:w-auto">
          <input
            className="flex-1 ps-2 h-7 text-xs border border-slate-300 rounded-md focus:border-slate-500 focus:ring-0 focus:outline-none"
            // placeholder="بحث..."
            placeholder={t("searchPlaceholder")}
            type="number"
            value={searchNumber}
            onChange={(e) => setSearchNumber(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                onInvoiceSearch();
              }
            }}
          />
          <Button
            className="h-7 px-2 text-xs bg-slate-600 text-white hover:bg-slate-700 border border-slate-600 rounded-md shadow-sm"
            size="sm"
            onPress={onInvoiceSearch}
          >
            <SearchIcon className="w-4 h-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}
