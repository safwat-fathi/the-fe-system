import { Metadata } from "next";
import { getTranslations } from "next-intl/server";

import InvoicesHeader from "./components/InvoicesHeader";
import InvoiceClientWrapper from "./InvoiceClientWrapper";

import Breadcrumb from "@/components/Breadcrumb";
import invoiceService, {
  GetAllInvoicesParams,
} from "@/services/api/invoice.service";
import AppPagination from "@/components/AppPagination";
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

      <InvoiceClientWrapper
        invoices={invoices?.results ?? []}
        totalInvoices={count}
      />

      <AppPagination total={totalPages} />
    </div>
  );
}
