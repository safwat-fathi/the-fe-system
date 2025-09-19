import { Invoice } from "@/types/invoice";
import { cookies } from "next/headers";
import { notFound } from "next/navigation";
import Card from "@/components/Card";
import { CardBody } from "@heroui/react";
import {
  EyeIcon,
  PencilIcon,
  ArrowDownTrayIcon,
  FunnelIcon,
  ChartBarIcon,
  TableCellsIcon,
  PrinterIcon,
  PlusIcon,
} from "@heroicons/react/24/outline";
import { formatDateTime } from "@/utilities/dateUtils";
import { formatAmount } from "@/utilities/formatAmount";
import DataTable from "@/components/DataTable";
import { InfoCard, MetricCard } from "@/components/Card";
import InvoiceAnalytics from "@/components/InvoiceAnalytics";
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

// Fetch invoices on the server side with caching
// async function getInvoices() {
//   try {
//     // Using the existing service for consistency with the codebase
//     const invoices = await invoiceService.getAllInvoices();
//     return invoices;
//   } catch (error) {
//     console.error("Error fetching invoices:", error);
//     return [];
//   }
// }

export default async function InvoicesPage() {
  // Fetch invoices on the server side
  const invoices = await invoiceService.getAllInvoices();
  console.log("🚀 ~ :59 ~ InvoicesPage ~ invoices:", invoices);

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
            className="inline-flex items-center gap-2 rounded-md bg-success px-4 py-2 text-white"
          >
            <PlusIcon className="h-4 w-4" />
            إضافة فاتورة
          </Link>
          <PrintButton />
          <button
            className="inline-flex items-center gap-2 rounded-md bg-primary px-4 py-2 text-white"
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
