import { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { Suspense } from "react";

import CashReceiptVoucherClientPage from "./CashReceiptVoucherClientPage";
import useNavigationInfo from "./hooks/useNavigationInfo";
import { voucherStatuses } from "./constants";

import Breadcrumb from "@/components/Breadcrumb";
import CashReceiptFormData from "@/services/bff/cash-receipt-form-data.service";
import { cashReceiptService } from "@/services/api/cash-receipt.service";

export const metadata: Metadata = {
  title: "سند قبض - NafeesWeb",
  description: "إدارة سندات القبض",
};

function CashReceiptFormFallback() {
  return (
    <div className="p-4 my-4 bg-white rounded-lg shadow-sm border border-gray-200 min-h-[600px] flex items-center justify-center">
      <div className="flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" />
      </div>
    </div>
  );
}

const { getCashReceiptFormData, getCashReceiptVoucherForNavigation } =
  CashReceiptFormData;

export default async function ReceiptVoucherPage() {
  const t = await getTranslations("forms.cashReceiptVoucher");

  const [formData, voucherForNav, nextVoucherNumberResponse] =
    await Promise.all([
      getCashReceiptFormData(),
      getCashReceiptVoucherForNavigation(),
      cashReceiptService.getNextCashReceiptNumber(1),
    ]);

  const nextVoucherNumber =
    typeof nextVoucherNumberResponse === "number"
      ? nextVoucherNumberResponse
      : 1;

  const navigationInfo = useNavigationInfo(voucherForNav);

  return (
    <div className="container mx-auto p-4">
      <div className="flex items-center justify-between mb-2">
        <Breadcrumb
          items={[
            { name: t("breadcrumbs.list"), href: "/forms/cash-receipt" },
            { name: t("breadcrumbs.new") },
          ]}
        />
      </div>
      <Suspense fallback={<CashReceiptFormFallback />}>
        <CashReceiptVoucherClientPage
          accounts={formData.accounts}
          boxes={formData.boxes}
          costCenters={formData.costCenters}
          formMode="new"
          isNewVoucher={true}
          navigationInfo={navigationInfo}
          startInEditMode={true}
          vouchType={1}
          voucherStatuses={
            formData.voucherStatuses.length > 0
              ? formData.voucherStatuses
              : voucherStatuses
          }
          voucherTypes={formData.voucherTypes}
          initialVoucherNumber={nextVoucherNumber}
        />
      </Suspense>
    </div>
  );
}
