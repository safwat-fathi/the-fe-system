// import { notFound } from 'next/navigation';
// import { Metadata } from 'next';
// import InvoiceService from '@/services/api/invoice.service';
// import { Breadcrumb } from '@/components';

// // Generate metadata for the page
// export async function generateMetadata({ params }: { params: Promise<{ id: string }> }): Promise<Metadata> {
//   const { id } = await params;

//   return {
//     title: `فاتورة رقم ${id}`,
//     description: `عرض تفاصيل فاتورة رقم ${id}`,
//   };
// }

// // Server component to fetch and display invoice details
// export default async function InvoiceDetailPage({ params }: { params: Promise<{ id: string }> }) {
//   const { id } = await params;

//   // Fetch invoice data
//   const invoiceData = await InvoiceService.getInvoiceById(id);
//   console.log("🚀 ~ :22 ~ InvoiceDetailPage ~ invoiceData:", invoiceData);

//   if (!invoiceData) {
//     notFound();
//   }

//   const invoiceDetailsData = await InvoiceService.getInvoiceDetails(
//     invoiceData.id,
//   );
//   console.log(
//     "🚀 ~ :23 ~ InvoiceDetailPage ~ invoiceDetailsData:",
//     invoiceDetailsData,
//   );

// }
import { Metadata } from "next";
import InvoiceService from "@/services/api/invoice.service";
import invoiceFormDataService from "@/services/bff/invoice-form-data.service";
import InvoiceClientPage from "./page.client";
import { Invoice, InvoiceDetail } from "@/types/models/invoice";

// Generate metadata for the page
export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}): Promise<Metadata> {
  const { id } = await params;

  return {
    title: `فاتورة رقم ${id}`,
    description: `عرض تفاصيل فاتورة رقم ${id}`,
  };
}

// Server component to fetch and display invoice details
export default async function InvoiceDetailPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const [{ id }, resolvedSearchParams] = await Promise.all([
    params,
    searchParams,
  ]);

  const rawEdit = resolvedSearchParams.edit;
  const editParam = Array.isArray(rawEdit) ? rawEdit[0] : rawEdit;
  const isEditMode = editParam === "true";

  let invoiceData: Invoice | null = null;
  let invoiceDetailsData: InvoiceDetail[] = [];

  // Fetch invoice data
  if (id) {
    invoiceData = await InvoiceService.getInvoiceById(id);

    if (invoiceData) {
      invoiceDetailsData = await InvoiceService.getInvoiceDetails(
        invoiceData.id,
      );
    }
  }

  // Fetch form data (customers, items, categories, gold price, home purity)
  const formData = await invoiceFormDataService.getInvoiceFormData();
  console.log(
    "🚀 ~ :83 ~ InvoiceDetailPage ~ formData:",
    formData.categories.length,
    formData.customers.length,
    formData.items.length,
  );

  return (
    <div className="container mx-auto p-4">
      <InvoiceClientPage
        invoiceData={invoiceData}
        invoiceDetailsData={invoiceDetailsData}
        isNewInvoice={id ? false : true}
        startInEditMode={isEditMode}
        customers={formData.customers}
        items={formData.items}
        categories={formData.categories}
        goldPrice={formData.goldPrice}
        homePurity={formData.homePurity}
      />
    </div>
  );
}
