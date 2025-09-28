import { ArrowDownTrayIcon, PlusIcon } from "@heroicons/react/24/outline";
import InvoiceClient from "./components/InvoiceClient";
import invoiceService, {
  GetAllInvoicesParams,
} from "@/services/api/invoice.service";
import { Suspense } from "react";
import PrintButton from "@/components/PrintButton";
import Link from "next/link";
import AppLoading from "@/components/AppLoading";
import AppPagination from "../../../../components/AppPagination";
import InvoicesHeader from "./components/InvoicesHeader";
import { TransTypes } from "@/types/models/invoice";

export const revalidate = 3600;

// أنواع الفواتير
const INVOICE_TYPES = [
  { key: "0", label: "جميع الفواتير", color: "default" },
  { key: TransTypes.PURCHASE, label: "فواتير الشراء", color: "primary" },
  { key: TransTypes.SALES, label: "فواتير البيع", color: "success" },
  { key: TransTypes.PURCHASE_RETURN, label: "مردود الشراء", color: "warning" },
  { key: TransTypes.SALES_RETURN, label: "مردود البيع", color: "danger" },
];

// حالات الفواتير
const INVOICE_STATUSES = [
  { key: "all", label: "جميع الحالات", color: "default" },
  { key: "paid", label: "مدفوع", color: "success" },
  { key: "pending", label: "معلق", color: "warning" },
  { key: "overdue", label: "متأخر", color: "danger" },
];

export default async function InvoicesPage({
  searchParams,
}: {
  searchParams: Promise<GetAllInvoicesParams>;
}) {
  const queryParams = await searchParams;
  console.log("🚀 ~ :39 ~ InvoicesPage ~ queryParams:", queryParams);

  const invoices = await invoiceService.getAllInvoices(queryParams);
  console.log("🚀 ~ :42 ~ InvoicesPage ~ invoices count:", invoices?.count);

  const count = invoices?.count || 0;
  const itemsPerPage = 20;
  const totalPages = count > 0 ? Math.ceil(count / itemsPerPage) : 0;

  return (
    <div className="font-cairo space-y-4 p-4">
      <InvoicesHeader />

      <Suspense key={JSON.stringify(queryParams)} fallback={<AppLoading />}>
        <InvoiceClient
          totalInvoices={invoices?.count ?? 0}
          invoices={invoices?.results ?? []}
          invoiceTypes={INVOICE_TYPES}
          invoiceStatuses={INVOICE_STATUSES}
        />
      </Suspense>

      <AppPagination total={totalPages} />
    </div>
  );
}
