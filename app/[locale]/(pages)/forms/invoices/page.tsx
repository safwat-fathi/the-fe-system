import { Suspense, cache } from "react";
import { Metadata } from "next";
import { notFound } from "next/navigation";
import { getTranslations } from "next-intl/server";

import InvoiceClientPageWrapper from "@/app/[locale]/(pages)/forms/invoices/InvoiceClientPageWrapper";
import InvoiceTotalsActions from "@/app/[locale]/(pages)/forms/invoices/components/InvoiceTotalsActions";
import Breadcrumb from "@/components/Breadcrumb";
import invoiceFormDataService from "@/services/bff/invoice-form-data.service";
import invoiceService from "@/services/api/invoice.service";
import { Invoice, InvoiceDetail, TransTypes } from "@/types/models/invoice";
import { withAuthRedirect } from "@/utilities/auth/withAuthRedirect";

type InvoicePageType = "sale" | "purchase" | "sale-return" | "purchase-return";
type InvoiceFormMode = "new" | "edit" | "preview";
type RawQueryValue = string | string[] | undefined;
type RawSearchParams = Promise<Record<string, RawQueryValue>>;

const getInvoiceFormData = cache(() =>
  invoiceFormDataService.getInvoiceFormData(),
);

const INVOICE_TYPE_CONFIG: Record<
  InvoicePageType,
  {
    transType: TransTypes;
    titleKey:
      | "types.sale.title"
      | "types.purchase.title"
      | "types.saleReturn.title"
      | "types.purchaseReturn.title";
    descriptionKey:
      | "types.sale.description"
      | "types.purchase.description"
      | "types.saleReturn.description"
      | "types.purchaseReturn.description";
  }
> = {
  sale: {
    transType: TransTypes.SALES,
    titleKey: "types.sale.title",
    descriptionKey: "types.sale.description",
  },
  purchase: {
    transType: TransTypes.PURCHASE,
    titleKey: "types.purchase.title",
    descriptionKey: "types.purchase.description",
  },
  "sale-return": {
    transType: TransTypes.SALES_RETURN,
    titleKey: "types.saleReturn.title",
    descriptionKey: "types.saleReturn.description",
  },
  "purchase-return": {
    transType: TransTypes.PURCHASE_RETURN,
    titleKey: "types.purchaseReturn.title",
    descriptionKey: "types.purchaseReturn.description",
  },
};

const FALLBACK_TYPE: InvoicePageType = "sale";

const toSingleValue = (value: RawQueryValue): string | undefined => {
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

  if (mode === "edit") return "edit";
  if (mode === "preview") return "preview";

  return "new";
};

export async function generateMetadata({
  searchParams,
}: {
  searchParams: RawSearchParams;
}): Promise<Metadata> {
  const params = await searchParams;
  const invoiceType = resolveInvoiceType(toSingleValue(params.type));
  const config = INVOICE_TYPE_CONFIG[invoiceType];
  const t = await getTranslations("forms.invoices");

  return {
    title: t(config.titleKey),
    description: t(config.descriptionKey),
  };
}

function InvoiceFormFallback() {
  return (
    <div className="p-4 my-4 bg-white rounded-lg shadow-sm border border-gray-200 min-h-[600px] flex items-center justify-center">
      <div className="flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" />
      </div>
    </div>
  );
}

const parseInvoicePageParams = (
  params: Record<string, RawQueryValue>,
): {
  invoiceType: InvoicePageType;
  mode: InvoiceFormMode;
  editId?: string;
  startInEdit: boolean;
} => {
  const invoiceType = resolveInvoiceType(toSingleValue(params.type));
  const mode = resolveFormMode(toSingleValue(params.mode));
  const editInvId = toSingleValue(params.inv_id);
  const editRecordId = toSingleValue(params.id);
  const editId = editInvId ?? editRecordId ?? undefined;
  const startInEdit = toSingleValue(params.edit) === "true";

  return {
    invoiceType,
    mode,
    editId,
    startInEdit,
  };
};

const loadInvoiceData = async ({
  mode,
  editId,
  config,
}: {
  mode: InvoiceFormMode;
  editId?: string;
  config: (typeof INVOICE_TYPE_CONFIG)[InvoicePageType];
}): Promise<{
  invoiceData: Invoice | null;
  invoiceDetails: InvoiceDetail[];
}> => {
  if (!(mode === "edit" || mode === "preview") || !editId) {
    return { invoiceData: null, invoiceDetails: [] };
  }

  const lookupId = editId ?? "";
  const invoiceData = await invoiceService.getInvoiceById(
    lookupId,
    config.transType,
  );

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
        invoiceData?.id ? String(invoiceData.id) : null,
        invoiceData?.inv_id,
        editId,
      ]
        .filter((key): key is string => Boolean(key && `${key}`.trim().length))
        .map((key) => String(key).trim()),
    ),
  );

  for (const key of detailKeys) {
    const fetchedDetails =
      (await invoiceService.getInvoiceDetails(key, config.transType)) ?? [];

    if (fetchedDetails.length > 0) {
      return {
        invoiceData,
        invoiceDetails: fetchedDetails,
      };
    }
  }

  return {
    invoiceData,
    invoiceDetails: [],
  };
};

export default async function InvoicePage({
  searchParams,
}: {
  searchParams: RawSearchParams;
}) {
  const params = await searchParams;
  const t = await getTranslations("forms.invoices");

  const { invoiceType, mode, editId, startInEdit } =
    parseInvoicePageParams(params);

  if ((mode === "edit" || mode === "preview") && !editId) {
    notFound();
  }

  const config = INVOICE_TYPE_CONFIG[invoiceType];
  const typeTitle = t(config.titleKey);

  const { invoiceData, invoiceDetails } = await withAuthRedirect(() =>
    loadInvoiceData({ mode, editId, config }),
  );

  const formData = await withAuthRedirect(() => getInvoiceFormData());

  const newInvoiceHref = `/forms/invoices?type=${encodeURIComponent(
    invoiceType,
  )}&mode=new`;
  const invoiceIdentifier = String(invoiceData?.inv_id ?? editId ?? "");
  let breadcrumbModeLabel = t("breadcrumbs.preview");

  if (mode === "new") {
    breadcrumbModeLabel = t("breadcrumbs.new");
  } else if (mode === "edit") {
    breadcrumbModeLabel = invoiceIdentifier
      ? t("breadcrumbs.editWithId", { id: invoiceIdentifier })
      : t("breadcrumbs.edit");
  }

  return (
    <div className="container mx-auto p-2 sm:p-4">
      <Breadcrumb
        items={[
          { name: t("breadcrumbs.list"), href: "/reports/invoices" },
          {
            name: typeTitle,
            href: newInvoiceHref,
          },
          { name: breadcrumbModeLabel },
        ]}
      />

      <div className="space-y-4">
        <InvoiceTotalsActions />
        <Suspense
          key={`${invoiceType}-${mode}-${invoiceData?.id ?? "new"}`}
          fallback={<InvoiceFormFallback />}
        >
          <InvoiceClientPageWrapper
            boxes={formData.boxes}
            categories={formData.categories}
            customers={formData.customers}
            formMode={mode}
            goldPrice={formData.goldPrice}
            homePurity={formData.homePurity}
            invoiceData={invoiceData}
            invoiceDetailsData={invoiceDetails}
            invoiceRecordId={invoiceData?.id ?? null}
            invoiceType={invoiceType}
            isNewInvoice={mode === "new"}
            items={formData.items}
            newInvoiceHref={newInvoiceHref}
            startInEditMode={startInEdit || mode === "edit"}
          />
        </Suspense>
      </div>
    </div>
  );
}
