import { Suspense, cache } from "react";
import { Metadata } from "next";
import { getTranslations } from "next-intl/server";

import BalanceVoucherClientPageWrapper from "./BalanceVoucherClientPageWrapper";
import VoucherStatusCheckboxes from "./components/VoucherStatusCheckboxes";

import balanceVoucherFormDataService from "@/services/bff/balance-voucher-form-data.service";
import { Voucher } from "@/types/voucher";
import Breadcrumb from "@/components/Breadcrumb";
import { getNextVoucherNumber } from "@/utilities/numbering";

export const metadata: Metadata = {
  title: "قيد افتتاحي - NafeesWeb",
  description: "القيد الافتتاحي",
};

// Cache form data for better performance
const getBalanceVoucherFormData = cache(() =>
  balanceVoucherFormDataService.getBalanceVoucherFormData(),
);

// Parse search parameters
const parseBalanceVoucherParams = (
  params: Record<string, string | string[] | undefined>,
): {
  mode: "new" | "edit" | "preview";
  startInEdit: boolean;
} => {
  const rawMode = Array.isArray(params.mode) ? params.mode[0] : params.mode;
  const mode =
    rawMode === "edit" ? "edit" : rawMode === "preview" ? "preview" : "new";

  return {
    mode,
    startInEdit: mode === "edit",
  };
};

// Generate voucher number on server side (cached for performance)
const generateVoucherNumber = cache(async (): Promise<number> => {
  try {
    return await getNextVoucherNumber(0);
  } catch (error) {
    // Log error but don't throw - use fallback value
    if (process.env.NODE_ENV === "development") {
      console.error("[SERVER] Error generating voucher number:", error);
    }

    return 1; // fallback
  }
});

// Fallback component for loading state
function BalanceVoucherFormFallback() {
  return (
    <div className="p-4 my-4 bg-white rounded-lg shadow-sm border border-gray-200 min-h-[600px] flex items-center justify-center">
      <div className="flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" />
      </div>
    </div>
  );
}

export default async function BalanceVoucherPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const t = await getTranslations("forms.balanceVoucher");

  const searchParamsData = await searchParams;
  const { mode, startInEdit } = parseBalanceVoucherParams(searchParamsData);

  // Fetch form data first, then use service to load voucher + details
  const formData = await getBalanceVoucherFormData();
  const { voucher: existingVoucher, details } =
    await balanceVoucherFormDataService.getBalanceVoucherWithDetails(formData);

  // If voucher exists, display it
  if (existingVoucher && existingVoucher.id) {
    const voucher = existingVoucher;

    const formMode = mode === "edit" ? "edit" : "preview";
    const voucherId = existingVoucher.id;

    return (
      <div className="container mx-auto p-4">
        <div className="flex items-center justify-between mb-2">
          <Breadcrumb
            items={[
              { name: t("breadcrumbs.list"), href: "/forms/balance" },
              {
                name:
                  formMode === "edit"
                    ? t("breadcrumbs.edit", {
                        id: voucher.vouch_id || voucherId || "",
                      })
                    : t("breadcrumbs.preview"),
              },
            ]}
          />
          <VoucherStatusCheckboxes
            commit={voucher.commit ?? false}
            post={voucher.post ?? false}
            print={voucher.print ?? false}
          />
        </div>
        <Suspense
          key={`balance-${formMode}-${voucherId}`}
          fallback={<BalanceVoucherFormFallback />}
        >
          <BalanceVoucherClientPageWrapper
            formData={formData}
            formMode={formMode}
            isNewVoucher={false}
            startInEditMode={startInEdit}
            voucherData={voucher}
            voucherDetailsData={details}
            voucherRecordId={voucherId}
          />
        </Suspense>
      </div>
    );
  }

  // If no voucher exists, show new voucher form with pre-generated number
  const nextVoucherId = await generateVoucherNumber();
  const newVoucher: Voucher = {
    vouch_id: nextVoucherId,
    vouch_date: new Date().toISOString(),
    vouch_type: 0,
    vouch_amt: 0,
    pay_type: 1,
    cr_date: new Date().toISOString(),
    vouch_status: 1,
    commit: false,
    post: false,
    print: false,
    cost_id: null,
    ref_no: "",
    vouch_notes: "",
  };

  return (
    <div className="container mx-auto p-4">
      <div className="flex items-center justify-between mb-2">
        <Breadcrumb
          items={[
            {
              name: t("breadcrumbs.vouchers"),
              href: "/forms/voucher?type=adjustment",
            },
            { name: t("breadcrumbs.list"), href: "/forms/balance" },
          ]}
        />
      </div>
      <Suspense key="balance-new" fallback={<BalanceVoucherFormFallback />}>
        <BalanceVoucherClientPageWrapper
          formData={formData}
          formMode="new"
          isNewVoucher={true}
          voucherData={newVoucher}
        />
      </Suspense>
    </div>
  );
}
