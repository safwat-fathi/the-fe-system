import { notFound } from "next/navigation";
import { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { Suspense } from "react";

import CashReceiptVoucherClientPage from "../CashReceiptVoucherClientPage";
import VoucherStatusCheckboxes from "../components/VoucherStatusCheckboxes";
import useNavigationInfo, {
  VoucherNavigationSource,
} from "../hooks/useNavigationInfo";
import { voucherStatuses } from "../constants";

import CashReceiptFormData from "@/services/bff/cash-receipt-form-data.service";
import { cashReceiptService } from "@/services/api/cash-receipt.service";
import Breadcrumb from "@/components/Breadcrumb";

export const metadata: Metadata = {
  title: "عرض سند قبض - NafeesWeb",
  description: "عرض وتعديل سند القبض",
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

const {
  getCashReceiptFormData,
  getCashReceiptVoucher,
  getCashReceiptDetails,
  getCashReceiptBoxes,
  processVoucherData,
} = CashReceiptFormData;

export default async function ReceiptVoucherEditPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const t = await getTranslations("forms.cashReceiptVoucher");
  const { id } = await params;
  const searchParamsData = await searchParams;
  const mode = Array.isArray(searchParamsData.mode)
    ? searchParamsData.mode[0]
    : searchParamsData.mode;

  // تحديد الوضع: preview (افتراضي بعد الحفظ) أو edit
  const formMode = mode === "edit" ? "edit" : "preview";
  const startInEditMode = mode === "edit";

  const voucherId = parseInt(id);

  // التحقق من صحة المعرف
  if (isNaN(voucherId) || voucherId <= 0) {
    notFound();
  }

  // جلب البيانات بشكل متوازي
  const [targetVoucher, formData] = await Promise.all([
    getCashReceiptVoucher(voucherId),
    getCashReceiptFormData(),
  ]);

  if (!targetVoucher || !targetVoucher.id) {
    notFound();
  }

  // جلب تفاصيل القيد والصناديق بشكل متوازي
  const branchId = Number(targetVoucher.com_id ?? targetVoucher.com ?? 1) || 1;
  const voucherIdValue = targetVoucher.id;

  const [detailsData, boxesData] = await Promise.all([
    getCashReceiptDetails(voucherIdValue, branchId),
    getCashReceiptBoxes(voucherIdValue, branchId),
  ]);

  const { formattedVoucher, details, boxes } = processVoucherData(
    targetVoucher,
    detailsData,
    boxesData,
    formData,
  );

  const nextVoucherNumberResponse =
    await cashReceiptService.getNextCashReceiptNumber(1);
  const nextVoucherNumber =
    typeof nextVoucherNumberResponse === "number"
      ? nextVoucherNumberResponse
      : 1;

  const navigationInfo = useNavigationInfo(
    targetVoucher as VoucherNavigationSource,
  );

  return (
    <div className="container mx-auto p-4">
      <div className="flex items-center justify-between mb-2">
        <Breadcrumb
          items={[
            { name: t("breadcrumbs.list"), href: "/forms/cash-receipt" },
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
        <VoucherStatusCheckboxes
          commit={formattedVoucher.commit ?? false}
          post={formattedVoucher.post ?? false}
          print={formattedVoucher.print ?? false}
        />
      </div>
      <Suspense fallback={<CashReceiptFormFallback />}>
        <CashReceiptVoucherClientPage
          accounts={formData.accounts}
          boxes={formData.boxes}
          costCenters={formData.costCenters}
          formMode={formMode}
          isNewVoucher={false}
          navigationInfo={navigationInfo}
          startInEditMode={startInEditMode}
          vouchType={1}
          voucherBoxes={boxes}
          voucherData={formattedVoucher}
          voucherDetailsData={details}
          voucherRecordId={targetVoucher.id}
          voucherVouchId={Number(targetVoucher.vouch_id) || 0}
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
