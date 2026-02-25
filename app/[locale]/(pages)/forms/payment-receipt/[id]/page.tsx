import { notFound } from "next/navigation";
import { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { Suspense } from "react";

import useNavigationInfo, {
  type VoucherNavigationSource,
} from "../../cash-receipt/hooks/useNavigationInfo";
import PaymentReceiptVoucherClientPage from "../PaymentReceiptVoucherClientPage";
import { voucherStatuses } from "../constants";

import paymentReceiptFormDataService from "@/services/bff/payment-receipt-form-data.service";
import Breadcrumb from "@/components/Breadcrumb";
import { paymentReceiptService } from "@/services/api/payment-receipt.service";

export const metadata: Metadata = {
  title: "عرض سند صرف - NafeesWeb",
  description: "عرض وتعديل سند الصرف",
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

const {
  getPaymentReceiptFormData,
  getPaymentReceiptVoucher,
  getPaymentReceiptBoxes,
  getPaymentReceiptDetails,
  processVoucherData,
} = paymentReceiptFormDataService;

export default async function PaymentVoucherEditPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const t = await getTranslations("forms.paymentReceipt");
  const { id } = await params;
  const searchParamsData = await searchParams;
  const mode = Array.isArray(searchParamsData.mode)
    ? searchParamsData.mode[0]
    : searchParamsData.mode;

  // تحديد الوضع: preview (افتراضي بعد الحفظ) أو edit
  const formMode = mode === "edit" ? "edit" : "preview";

  const voucherId = parseInt(id);

  // التحقق من صحة المعرف
  if (isNaN(voucherId) || voucherId <= 0) {
    notFound();
  }

  // جلب البيانات بشكل متوازي
  const [targetVoucher, formData] = await Promise.all([
    getPaymentReceiptVoucher(voucherId),
    getPaymentReceiptFormData(),
  ]);

  if (!targetVoucher || !targetVoucher.id) {
    notFound();
  }

  // جلب تفاصيل القيد والصناديق بشكل متوازي
  const branchId = Number(targetVoucher.com_id ?? targetVoucher.com ?? 1) || 1;
  const voucherIdValue = targetVoucher.id;
  const [detailsData, boxesData] = await Promise.all([
    getPaymentReceiptDetails(voucherIdValue, branchId),
    getPaymentReceiptBoxes(voucherIdValue, branchId),
  ]);

  const { formattedVoucher, details, boxes } = processVoucherData(
    targetVoucher,
    detailsData,
    boxesData,
    formData,
  );

  const nextVoucherNumberResponse =
    await paymentReceiptService.getNextPaymentReceiptNumber(1);
  const nextVoucherNumber =
    typeof nextVoucherNumberResponse === "number"
      ? nextVoucherNumberResponse
      : 1;

  const navigationInfo = useNavigationInfo(
    targetVoucher as VoucherNavigationSource,
  );

  return (
    <div className="container mx-auto p-4">
      <Breadcrumb
        items={[
          { name: t("breadcrumbs.list"), href: "/forms/payment-receipt" },
          {
            name:
              formMode === "edit"
                ? t("breadcrumbs.edit", {
                    id: targetVoucher.vouch_id || targetVoucher.id || "",
                  })
                : t("breadcrumbs.preview"),
          },
        ]}
      />
      <Suspense fallback={<PaymentReceiptFormFallback />}>
        <PaymentReceiptVoucherClientPage
          accounts={formData.accounts}
          boxes={formData.boxes}
          costCenters={formData.costCenters}
          formMode={formMode}
          navigationInfo={navigationInfo}
          vouchType={2}
          voucherBoxes={boxes}
          voucherData={formattedVoucher}
          voucherDetailsData={details}
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
