import { cache } from "react";
import { Metadata } from "next";
import { notFound } from "next/navigation";

import InvoiceClientPage from "@/app/(pages)/forms/invoices/InvoiceClientPage";
import invoiceFormDataService from "@/services/bff/invoice-form-data.service";
import invoiceService from "@/services/api/invoice.service";
import { Invoice, InvoiceDetail, TransTypes } from "@/types/models/invoice";

type InvoicePageType = "sale" | "purchase" | "sale-return" | "purchase-return";
type InvoiceFormMode = "new" | "edit";

const getInvoiceFormData = cache(() =>
  invoiceFormDataService.getInvoiceFormData(),
);

const INVOICE_TYPE_CONFIG: Record<
  InvoicePageType,
  {
    title: string;
    description: string;
    transType: TransTypes;
  }
> = {
  sale: {
    title: "فاتورة بيع",
    description: "إدارة فواتير البيع",
    transType: TransTypes.SALES,
  },
  purchase: {
    title: "فاتورة شراء",
    description: "إدارة فواتير الشراء",
    transType: TransTypes.PURCHASE,
  },
  "sale-return": {
    title: "مردود بيع",
    description: "إدارة فواتير مردود البيع",
    transType: TransTypes.SALES_RETURN,
  },
  "purchase-return": {
    title: "مردود شراء",
    description: "إدارة فواتير مردود الشراء",
    transType: TransTypes.PURCHASE_RETURN,
  },
};

const FALLBACK_TYPE: InvoicePageType = "sale";

const toSingleValue = (
  value: string | string[] | undefined,
): string | undefined => {
  if (Array.isArray(value)) return value[0];
  return value;
};

const resolveInvoiceType = (rawType: string | undefined): InvoicePageType => {
  if (!rawType) return FALLBACK_TYPE;
  const type = rawType.toLowerCase() as InvoicePageType;
  return type in INVOICE_TYPE_CONFIG ? type : FALLBACK_TYPE;
};

const resolveFormMode = (rawMode: string | undefined): InvoiceFormMode => {
  if (!rawMode) return "new";
  const mode = rawMode.toLowerCase();
  return mode === "edit" ? "edit" : "new";
};

export async function generateMetadata({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}): Promise<Metadata> {
  const params = await searchParams;
  const invoiceType = resolveInvoiceType(toSingleValue(params.type));
  const config = INVOICE_TYPE_CONFIG[invoiceType];

  return {
    title: config.title,
    description: config.description,
  };
}

export default async function InvoicePage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const params = await searchParams;

  const invoiceType = resolveInvoiceType(toSingleValue(params.type));
  const mode = resolveFormMode(toSingleValue(params.mode));
  const editId = toSingleValue(params.id);
  const recordId = toSingleValue(params.recordId);
  const startInEdit = toSingleValue(params.edit) === "true";

  if (mode === "edit" && !editId) {
    notFound();
  }

  const config = INVOICE_TYPE_CONFIG[invoiceType];

  let invoiceData: Invoice | null = null;
  let invoiceDetails: InvoiceDetail[] = [];

  if (mode === "edit" && editId) {
    invoiceData = await invoiceService.getInvoiceById(editId);

    if (!invoiceData) {
      notFound();
    }

    if (
      invoiceData.trans_type &&
      Number(invoiceData.trans_type) !== Number(config.transType)
    ) {
      notFound();
    }

    const detailKeys = Array.from(
      new Set(
        [
          invoiceData?.inv_id,
          editId,
          recordId,
          invoiceData?.id ? String(invoiceData.id) : null,
        ]
          .filter((key): key is string => Boolean(key && `${key}`.trim().length))
          .map((key) => String(key).trim()),
      ),
    );

    for (const key of detailKeys) {
      const fetchedDetails =
        (await invoiceService.getInvoiceDetails(key)) ?? [];

      if (fetchedDetails.length > 0) {
        invoiceDetails = fetchedDetails;
        break;
      }
    }
  }

  const formData = await getInvoiceFormData();

  const newInvoiceHref = `/forms/invoices?type=${encodeURIComponent(
    invoiceType,
  )}&mode=new`;

  return (
    <div className="container mx-auto p-4">
      <InvoiceClientPage
        invoiceType={invoiceType}
        formMode={mode}
        invoiceData={invoiceData}
        invoiceDetailsData={invoiceDetails}
        isNewInvoice={mode === "new"}
        startInEditMode={startInEdit || mode === "edit"}
        invoiceRecordId={invoiceData?.id ?? recordId ?? null}
        customers={formData.customers}
        items={formData.items}
        categories={formData.categories}
        goldPrice={formData.goldPrice}
        homePurity={formData.homePurity}
        newInvoiceHref={newInvoiceHref}
      />
    </div>
  );
}
