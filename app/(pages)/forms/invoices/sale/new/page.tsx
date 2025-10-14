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

export default async function NewInvoicePage() {
  const formData = await loadInvoiceFormData();

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
