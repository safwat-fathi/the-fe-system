import { Suspense } from "react";
import { Metadata } from "next";
import { getTranslations } from "next-intl/server";

import InvoiceClient from "./components/InvoiceClient";
import InvoicesHeader from "./components/InvoicesHeader";

import Breadcrumb from "@/components/Breadcrumb";
import invoiceService, {
  GetAllInvoicesParams,
} from "@/services/api/invoice.service";
import AppPagination from "@/components/AppPagination";
import AppLoading from "@/components/AppLoading";
import { redirectToLogin } from "@/app/actions/auth";
import { AuthenticationError } from "@/utilities/errors/Authentication";
import { Invoice } from "@/types/models/invoice";
import { IPaginatedResponse } from "@/types/services/base";

export const revalidate = 3600;

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("reports.invoices");

  return {
    title: t("title"),
    description: t("description"),
  };
}

export default async function InvoicesPage({
  searchParams,
}: {
  searchParams: Promise<GetAllInvoicesParams>;
}) {
  const queryParams = await searchParams;

  let invoices: IPaginatedResponse<Invoice> | null = null;

  try {
    invoices = await invoiceService.getAllInvoices(queryParams);
  } catch (error) {
    if (error instanceof AuthenticationError) {
      await redirectToLogin();
    }

    throw error;
  }

  const count = invoices?.count || 0;
  const itemsPerPage = 20;
  const totalPages = count > 0 ? Math.ceil(count / itemsPerPage) : 0;

  return (
    <div className="font-cairo space-y-4 p-4">
      <Breadcrumb />
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
