import { ArrowDownTrayIcon, PlusIcon } from "@heroicons/react/24/outline";
import InvoiceClientComponent from "./InvoiceClientComponent";
import invoiceService from "@/services/api/invoice.service";
import { Suspense } from "react";
import PrintButton from "@/components/PrintButton";
import Link from "next/link";
import AppLoading from "@/components/AppLoading";

// أنواع الفواتير
const INVOICE_TYPES = [
  { key: "all", label: "جميع الفواتير", color: "default" },
  { key: "purchase", label: "فواتير الشراء", color: "primary" },
  { key: "sales", label: "فواتير البيع", color: "success" },
  { key: "purchase_return", label: "مردود الشراء", color: "warning" },
  { key: "sales_return", label: "مردود البيع", color: "danger" },
];

// حالات الفواتير
const INVOICE_STATUSES = [
  { key: "all", label: "جميع الحالات", color: "default" },
  { key: "paid", label: "مدفوع", color: "success" },
  { key: "pending", label: "معلق", color: "warning" },
  { key: "overdue", label: "متأخر", color: "danger" },
];

export const revalidate = 3600;

export default async function InvoicesPage() {
  // Fetch invoices on the server side
  const invoices = await invoiceService.getAllInvoices();

  return (
    <div className="font-cairo space-y-4 p-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">تقارير الفواتير</h1>
          <p className="text-gray-500 mt-1">إدارة وعرض جميع الفواتير</p>
        </div>
        <div className="flex gap-3">
          <Link
            href="/dashboard/forms/invoices/Gold_invoice2?new=true"
            className="inline-flex items-center gap-2 rounded-md border border-gray-300 px-4 py-2 text-gray-700"
          >
            <PlusIcon className="h-4 w-4" />
            إضافة فاتورة
          </Link>
          <PrintButton />
          <button
            className="inline-flex items-center gap-2 rounded-md border border-gray-300 px-4 py-2 text-gray-700"
            // onClick={() => {
            //   // Handle export
            //   alert("تم تصدير البيانات بنجاح");
            // }}
          >
            <ArrowDownTrayIcon className="h-4 w-4" />
            تصدير
          </button>
        </div>
      </div>

      {/* Client component for interactive features */}
      <Suspense fallback={<AppLoading />}>
        <InvoiceClientComponent
          initialInvoices={invoices}
          invoiceTypes={INVOICE_TYPES}
          invoiceStatuses={INVOICE_STATUSES}
        />
      </Suspense>
    </div>
  );
}
