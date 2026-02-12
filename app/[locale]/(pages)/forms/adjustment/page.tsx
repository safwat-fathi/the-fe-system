import { cache, Suspense } from "react";
import { Metadata } from "next";

import VoucherClientPage from "./AdjustmentVoucherClientPage";
import { voucherStatuses, voucherTypes } from "./constants";

import adjustmentVoucherFormDataService from "@/services/bff/adjustment-voucher-form-data.service";
import Breadcrumb from "@/components/Breadcrumb";
import { getNextAdjustmentVoucherNumberAction } from "@/app/actions/adjustment-voucher";

export const metadata: Metadata = {
  title: "قيد تسوية جديد - NafeesWeb",
  description: "إنشاء قيد تسوية جديد",
};

// استخدام الخدمة المحسنة مع cache
const getVoucherFormData = cache(() =>
  adjustmentVoucherFormDataService.getAdjustmentVoucherFormData(),
);

function VoucherFormFallback() {
  return (
    <div className="p-4 my-4 bg-white rounded-lg shadow-sm border border-gray-200 min-h-[600px] flex items-center justify-center">
      <div className="flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" />
      </div>
    </div>
  );
}

export default async function VoucherPage() {
  const formData = await getVoucherFormData();
  const nextVoucherNumber = await getNextAdjustmentVoucherNumberAction();

  return (
    <div className="container mx-auto p-4">
      <div className="flex items-center justify-between mb-2">
        <Breadcrumb
          items={[
            { name: "", segmentKey: "voucher", href: "/forms/adjustment" },
            { name: "", segmentKey: "new" },
          ]}
        />
      </div>
      <Suspense key={"voucher-page"} fallback={<VoucherFormFallback />}>
        <VoucherClientPage
          accounts={formData.accounts}
          caratTypes={formData.caratTypes}
          costCenters={formData.costCenters}
          formMode="new"
          isNewVoucher={true}
          newVoucherHref="/forms/adjustment"
          vouchType={3}
          voucherStatuses={
            formData.voucherStatuses.length > 0
              ? formData.voucherStatuses
              : voucherStatuses
          }
          voucherTypes={
            formData.voucherTypes.length > 0
              ? formData.voucherTypes
              : voucherTypes
          }
          initialVoucherNumber={nextVoucherNumber}
        />
      </Suspense>
    </div>
  );
}
