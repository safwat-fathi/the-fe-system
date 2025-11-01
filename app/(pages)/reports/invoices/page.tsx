import { Suspense } from "react";

import InvoiceClient from "./components/InvoiceClient";
import InvoicesHeader from "./components/InvoicesHeader";

import invoiceService, {
  GetAllInvoicesParams,
} from "@/services/api/invoice.service";
import AppPagination from "@/components/AppPagination";
import AppLoading from "@/components/AppLoading";

export const revalidate = 3600;

export default async function InvoicesPage({
  searchParams,
}: {
  searchParams: Promise<GetAllInvoicesParams>;
}) {
  const queryParams = await searchParams;

  const invoices = await invoiceService.getAllInvoices(queryParams);

  const count = invoices?.count || 0;
  const itemsPerPage = 20;
  const totalPages = count > 0 ? Math.ceil(count / itemsPerPage) : 0;

  return (
    <div className="font-cairo space-y-4 p-4">
      <InvoicesHeader />

      <Suspense
        key={JSON.stringify(queryParams)}
        fallback={
          <div className="py-12">
            <AppLoading />
          </div>
        }
      >
        <InvoiceClient
          invoices={invoices?.results ?? []}
          totalInvoices={count}
        />
      </Suspense>

      <AppPagination total={totalPages} />
    </div>
  );
}
