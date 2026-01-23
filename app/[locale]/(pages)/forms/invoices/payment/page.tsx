import { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { redirect } from "next/navigation";

import PaymentClientPage from "@/app/[locale]/(pages)/forms/invoices/payment/PaymentClientPage";
import { boxesService, invoiceService } from "@/services/api";
import {
  AuthenticationError,
} from "@/utilities/errors/Authentication";
import { Box } from "@/types/models/box";
import { Invoice, PaidType } from "@/types/models/invoice";
import { IPaginatedResponse } from "@/types/services/base";
import { getBranchParams } from "@/app/actions/branch-params";

type RawQueryValue = string | string[] | undefined;
type RawSearchParams = Promise<Record<string, RawQueryValue>>;

const toSingleValue = (value: RawQueryValue): string => {
  if (Array.isArray(value)) return value[0];

  return value || "";
};

export async function generateMetadata({
  searchParams,
}: {
  searchParams: RawSearchParams;
}): Promise<Metadata> {
  const t = await getTranslations("forms.paymentPage");
  const params = await searchParams;
  const invNumber =
    toSingleValue(params.inv_number) || toSingleValue(params.inv);

  return {
    title: invNumber ? `${t("title")} - ${invNumber}` : t("title"),
    description: t("title"),
  };
}

export default async function PaymentPage({
  searchParams,
}: {
  searchParams: Promise<{
    inv_number: string;
    inv: string;
    total: string;
    customer: string;
    inv_type: string;
    com: string;
    box_id?: string;
  }>;
}) {
  const params = await searchParams;

  const t = await getTranslations("forms.paymentPage");
	const { com } = await getBranchParams();

  if (!params.inv || !params.inv_number) {
    throw new Error(t("errors.invalidInvoice"));
  }

  let boxes: Box[] = [];
  let paymentMethodsResponse: IPaginatedResponse<PaidType> | null = null;
  let invoice: Invoice | null = null;
  let invoiceBoxes: any[] = [];

  // Fetch data in parallel
  try {
    [boxes, paymentMethodsResponse, invoice, invoiceBoxes] = await Promise.all([
      boxesService.getBoxes({ xcom_id: com }),
      invoiceService.getPaidTypeList(),
      invoiceService.getInvoiceById(toSingleValue(params.inv_number)),
      invoiceService.getInvoiceBoxList(toSingleValue(params.inv), Number(com)),
    ]);
  } catch (error) {
    console.error("Error fetching data:", error);
    if (error instanceof AuthenticationError) {
      redirect("/auth/login");
    }
    throw error;
  }


  // Guard: Validate invoice exists with matching invoice number
  if (!invoice) {
    throw new Error(t("errors.invoiceNotFound"));
  }

  // Guard: Check if invoice is not already paid (credit means already settled)
  // if (invoice.pay_type === PaymentTypes.CREDIT) {
  //   throw new Error(t("errors.alreadyPaid"));
  // }

  const paymentMethods = paymentMethodsResponse?.results || [];

  const initialData = {
    total: parseFloat(toSingleValue(params.total) || "0"),
    invoiceNumber:
      toSingleValue(params.inv_number) || toSingleValue(params.inv),
    customerName: toSingleValue(params.customer),
    invoiceId: toSingleValue(params.inv),
    companyId: toSingleValue(params.com) || "1",
    invoiceType: toSingleValue(params.inv_type) || "sale",
    boxId: toSingleValue(params.box_id),
  };

  return (
    <PaymentClientPage
      boxes={boxes || []}
      initialData={initialData}
      initialInvoiceBoxes={invoiceBoxes || []}
      paymentMethods={paymentMethods}
    />
  );
}
