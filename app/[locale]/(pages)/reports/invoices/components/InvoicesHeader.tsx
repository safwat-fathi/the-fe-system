"use client";

import { ArrowDownTrayIcon, PrinterIcon } from "@heroicons/react/24/outline";
import { useTranslations } from "next-intl";

import { useReportTableStore } from "@/hooks/useReportTableStore";

const InvoicesHeader = () => {
  const print = useReportTableStore((s) => s.print);
  const t = useTranslations("reports.invoices");

  return (
    <div className="flex items-center justify-between">
      <div>
        <h1 className="text-2xl font-bold text-gray-800">{t("header")}</h1>
        <p className="text-gray-500 mt-1">{t("subheader")}</p>
      </div>
      <div className="flex gap-3">
        {/* <Link
          href="/forms/invoices?type=sale&mode=new"
          className="inline-flex items-center gap-2 rounded-md border border-gray-300 px-4 py-2 text-gray-700"
          href="/forms/invoices?type=sale&mode=new"
        >
          <PlusIcon className="h-4 w-4" />
          إضافة فاتورة
        </Link> */}
        <button
          className="inline-flex items-center gap-2 rounded-md border border-gray-300 px-4 py-2 text-gray-700"
          type="button"
          onClick={() => print()}
        >
          <PrinterIcon className="h-4 w-4" />
          {t("print")}
        </button>
        <button
          className="inline-flex items-center gap-2 rounded-md border border-gray-300 px-4 py-2 text-gray-700"
          onClick={() => {
            // Handle export
            alert(t("exportSuccess"));
          }}
        >
          <ArrowDownTrayIcon className="h-4 w-4" />
          {t("export")}
        </button>
      </div>
    </div>
  );
};

export default InvoicesHeader;
