import InvoiceClient from "./components/InvoiceClient";
import invoiceService, {
  GetAllInvoicesParams,
} from "@/services/api/invoice.service";
// import { Suspense } from "react";
// import AppLoading from "@/components/AppLoading";
import AppPagination from "@/components/AppPagination";
import InvoicesHeader from "./components/InvoicesHeader";
import { getBranchParams } from "@/app/actions/branch-params";

export const revalidate = 3600;

export default async function InvoicesPage({
  searchParams,
}: {
  searchParams: Promise<GetAllInvoicesParams>;
}) {
  const queryParams = await searchParams;
  console.log("🚀 ~ :39 ~ InvoicesPage ~ queryParams:", queryParams);

  // جلب معاملات الفرع والسنة
  const branchParams = await getBranchParams();
  
  // دمج معاملات الفرع مع معاملات البحث
  const invoiceParams: GetAllInvoicesParams = {
    ...queryParams,
    xcom_id: branchParams.com,
    xyear_id: branchParams.year,
  };

  console.log("🚀 ~ InvoicesPage ~ invoiceParams:", invoiceParams);

  const invoices = await invoiceService.getAllInvoices(invoiceParams);
  console.log("🚀 ~ :42 ~ InvoicesPage ~ invoices count:", invoices?.count);

  const count = invoices?.count || 0;
  const itemsPerPage = 20;
  const totalPages = count > 0 ? Math.ceil(count / itemsPerPage) : 0;

  return (
    <div className="font-cairo space-y-4 p-4">
      <InvoicesHeader />

      {/* <Suspense key={JSON.stringify(queryParams)} fallback={<AppLoading />}> */}
      <InvoiceClient totalInvoices={count} invoices={invoices?.results ?? []} />
      {/* </Suspense> */}

      <AppPagination total={totalPages} />
    </div>
  );
}
