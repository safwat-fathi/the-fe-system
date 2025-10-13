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
import { notFound } from "next/navigation";
import { Metadata } from "next";
import InvoiceService from "@/services/api/invoice.service";
import { Breadcrumb } from "@/components";
import InvoiceClientPage from "./page.client";

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
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  // Fetch invoice data
  const invoiceData = await InvoiceService.getInvoiceById(id);

  if (!invoiceData) {
    notFound();
  }

  const invoiceDetailsData = await InvoiceService.getInvoiceDetails(
    invoiceData.id,
  );

  return (
    <div className="container mx-auto p-4">
      <InvoiceClientPage
        invoiceData={invoiceData}
        invoiceDetailsData={invoiceDetailsData}
        isNewInvoice={false}
      />
    </div>
  );
}
