"use client";

import { ArrowDownTrayIcon, PrinterIcon } from "@heroicons/react/24/outline";
import { useReportTableStore } from "@/hooks/useReportTableStore";

const InvoicesHeader = () => {
  const print = useReportTableStore((s) => s.print);

  return (
    <div className="flex items-center justify-between">
      <div>
        <h1 className="text-2xl font-bold text-gray-800">تقارير الفواتير</h1>
        <p className="text-gray-500 mt-1">إدارة وعرض جميع الفواتير</p>
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
          طباعة
        </button>
        <button
          className="inline-flex items-center gap-2 rounded-md border border-gray-300 px-4 py-2 text-gray-700"
          onClick={() => {
            // Handle export
            alert("تم تصدير البيانات بنجاح");
          }}
        >
          <ArrowDownTrayIcon className="h-4 w-4" />
          تصدير
        </button>
      </div>
    </div>
  );
};

export default InvoicesHeader;
