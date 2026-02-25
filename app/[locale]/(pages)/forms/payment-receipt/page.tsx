import { Metadata } from "next";
import { Suspense } from "react";

import useNavigationInfo from "../cash-receipt/hooks/useNavigationInfo";

import PaymentReceiptVoucherClientPage from "./PaymentReceiptVoucherClientPage";
import { voucherStatuses } from "./constants";

import paymentReceiptFormDataService from "@/services/bff/payment-receipt-form-data.service";
import Breadcrumb from "@/components/Breadcrumb";
import { paymentReceiptService } from "@/services/api/payment-receipt.service";

export const metadata: Metadata = {
  title: "سند صرف - NafeesWeb",
  description: "إدارة سندات الصرف",
};

function PaymentReceiptFormFallback() {
  return (
    <div className="p-4 my-4 bg-white rounded-lg shadow-sm border border-gray-200 min-h-[600px] flex items-center justify-center">
      <div className="flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" />
      </div>
    </div>
  );
}

const { getPaymentReceiptFormData, getPaymentReceiptVoucherForNavigation } =
  paymentReceiptFormDataService;

export default async function PaymentVoucherPage() {
  const [formData, voucherForNav, nextVoucherNumberResponse] =
    await Promise.all([
      getPaymentReceiptFormData(),
      getPaymentReceiptVoucherForNavigation(),
      paymentReceiptService.getNextPaymentReceiptNumber(2),
    ]);

  const nextVoucherNumber =
    typeof nextVoucherNumberResponse === "number"
      ? nextVoucherNumberResponse
      : 1;

  const navigationInfo = useNavigationInfo(voucherForNav);

  return (
    <div className="container mx-auto p-4">
      <Breadcrumb
        items={[
          { name: "سند صرف", href: "/forms/payment-receipt" },
          { name: "جديدة" },
        ]}
      />
      <Suspense fallback={<PaymentReceiptFormFallback />}>
        <PaymentReceiptVoucherClientPage
          accounts={formData.accounts}
          boxes={formData.boxes}
          costCenters={formData.costCenters}
          formMode="new"
          navigationInfo={navigationInfo}
          vouchType={2}
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
