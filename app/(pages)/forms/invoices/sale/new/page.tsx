import { cache } from "react";
import { Metadata } from "next";
import InvoiceClientPage from "@/app/(pages)/forms/invoices/sale/[id]/page.client";
import invoiceFormDataService from "@/services/bff/invoice-form-data.service";

const loadInvoiceFormData = cache(() =>
  invoiceFormDataService.getInvoiceFormData(),
);

export const metadata: Metadata = {
  title: "فاتورة جديدة",
  description: "إنشاء فاتورة بيع جديدة",
};

export default async function NewSaleInvoicePage() {
  const formData = await loadInvoiceFormData();
  console.log(
    "🚀 ~ :17 ~ NewSaleInvoicePage ~ formData - customers:",
    formData.customers.length,
  );
  console.log(
    "🚀 ~ :17 ~ NewSaleInvoicePage ~ formData - categories:",
    formData.categories.length,
  );
  console.log(
    "🚀 ~ :17 ~ NewSaleInvoicePage ~ formData - items:",
    formData.items,
  );

  return (
    <div className="container mx-auto p-4">
      <InvoiceClientPage
        invoiceData={null}
        invoiceDetailsData={[]}
        isNewInvoice
        customers={formData.customers}
        items={formData.items}
        categories={formData.categories}
        goldPrice={formData.goldPrice}
        homePurity={formData.homePurity}
      />
    </div>
  );
}
