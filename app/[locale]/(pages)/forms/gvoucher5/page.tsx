import { Suspense, cache } from "react";
import { Metadata } from "next";

import CustomerGoldVoucherClientPage from "../gvoucher4/CustomerGoldVoucherClientPage";

import voucherFormDataService from "@/services/bff/voucher-form-data.service";
import Breadcrumb from "@/components/Breadcrumb";

export const metadata: Metadata = {
  title: "سند صرف عميل - NafeesWeb",
  description: "إدارة سندات الصرف للعملاء",
};

// Cache form data for better performance
const getVoucherFormData = cache((options?: { goldBoxes?: boolean }) =>
  voucherFormDataService.getVoucherFormData(options || { goldBoxes: true }),
);

// Fallback component for loading state
function CustomerPaymentVoucherFormFallback() {
  return (
    <div className="p-4 my-4 bg-white rounded-lg shadow-sm border border-gray-200 min-h-[600px] flex items-center justify-center">
      <div className="flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" />
      </div>
    </div>
  );
}

export default async function CustomerPaymentVoucherPage() {
  const formData = await getVoucherFormData({ goldBoxes: true });

  return (
    <div className="container mx-auto p-4">
      <Breadcrumb
        items={[
          { name: "", segmentKey: "gvoucher5", href: "/forms/gvoucher5" },
          { name: "", segmentKey: "new" },
        ]}
      />
      <Suspense
        key="customer-payment-new"
        fallback={<CustomerPaymentVoucherFormFallback />}
      >
        <CustomerGoldVoucherClientPage
          accounts={formData.accounts}
          boxes={formData.boxes || []}
          categories={formData.categories || []}
          costCenters={formData.costCenters}
          customers={formData.customers || []}
          formMode="new"
          goldBoxes={formData.goldBoxes || formData.boxes || []}
          isNewVoucher={true}
          items={formData.items || []}
          startInEditMode={true}
          vouchType={5}
          voucherTypes={formData.voucherTypes}
        />
      </Suspense>
    </div>
  );
}
