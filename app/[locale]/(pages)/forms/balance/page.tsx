import { Suspense, cache } from "react";
import { Metadata } from "next";
import { getTranslations } from "next-intl/server";

import BalanceVoucherClientPageWrapper from "./BalanceVoucherClientPageWrapper";
import VoucherStatusCheckboxes from "./components/VoucherStatusCheckboxes";

import voucherFormDataService from "@/services/bff/voucher-form-data.service";
import { voucherService } from "@/services/api";
import { Voucher, VoucherDetail } from "@/types/voucher";
import Breadcrumb from "@/components/Breadcrumb";
import { redirectToLogin } from "@/app/actions/auth";
import { AuthenticationError } from "@/utilities/errors/Authentication";
import { getNextVoucherNumber } from "@/utilities/numbering";

export const metadata: Metadata = {
  title: "قيد افتتاحي - NafeesWeb",
  description: "القيد الافتتاحي",
};

// Cache form data for better performance
const getBalanceVoucherFormData = cache(() =>
  voucherFormDataService.getBalanceVoucherFormData(),
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

// Get existing balance voucher (cached for performance)
// Optimized: Only fetches vouchers of type 0 (balance voucher)
const getExistingBalanceVoucher = cache(async () => {
  try {
    const vouchersResponse = await voucherService.getAll({
      xvouch_type: "0", // قيد افتتاحي فقط
    });

    if (vouchersResponse.success && vouchersResponse.data) {
      const vouchers = Array.isArray(vouchersResponse.data)
        ? vouchersResponse.data
        : [];

      // Find first balance voucher (vouch_type = 0)
      const balanceVoucher = vouchers.find(
        (v: any) => v?.vouch_type === 0 || v?.vouch_type === "0",
      );

      return balanceVoucher || null;
    }

    return null;
  } catch (error) {
    // Log warning but don't throw - allow page to show new voucher form
    if (process.env.NODE_ENV === "development") {
      console.warn(
        "[SERVER] ⚠️ Failed to fetch existing balance voucher:",
        error instanceof Error ? error.message : String(error),
      );
    }

    return null;
  }
});

// Cache the voucher details for better performance
const getVoucherDetails = cache(
  async (voucherId: number, branchId?: number | string) => {
    try {
      if (!voucherId || isNaN(voucherId)) {
        return [];
      }

      const parsedBranchId = Number(branchId ?? 1) || 1;

      const detailsResponse = await voucherService.getDetails(voucherId, {
        xcom_id: parsedBranchId,
      });

      if (!detailsResponse.success || !detailsResponse.data) {
        return [];
      }

      return Array.isArray(detailsResponse.data) ? detailsResponse.data : [];
    } catch (error) {
      // Log error but return empty array to allow page to render
      if (process.env.NODE_ENV === "development") {
        console.error("[SERVER] Error fetching voucher details:", error);
      }

      return [];
    }
  },
);

// Load balance voucher data with proper formatting
const loadBalanceVoucherData = async (
  existingVoucher: any,
  formData: any,
): Promise<{
  voucher: Voucher;
  details: VoucherDetail[];
}> => {
  if (!existingVoucher?.id) {
    return {
      voucher: {
        vouch_id: 0,
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
      },
      details: [],
    };
  }

  const branchId =
    Number(existingVoucher.com_id ?? existingVoucher.com ?? 1) || 1;
  const detailsData = await getVoucherDetails(existingVoucher.id, branchId);

  // Create a Map for faster account lookup (O(1) instead of O(n))
  const accountsMap = new Map(
    formData.accounts.map((acc: any) => [acc.id, acc]),
  );

  // Process voucher details with account information
  const details: VoucherDetail[] = detailsData.map((detail: any) => {
    const accountId = detail.acc_id || detail.acc;
    const account = accountId ? accountsMap.get(accountId) : undefined;

    return {
      id: detail.id || 0,
      vouch_id: existingVoucher.vouch_id || 0,
      acc_id: detail.acc_id || detail.acc || 0,
      acc_code: (account as any)?.acc_code || detail.acc_code || "",
      acc_name: (account as any)?.acc_name || detail.acc_name || "",
      cost_id: detail.cost_id || detail.cost || 0,
      debit:
        detail.debit !== undefined && detail.debit !== null
          ? parseFloat(String(detail.debit))
          : undefined,
      credit:
        detail.credit !== undefined && detail.credit !== null
          ? parseFloat(String(detail.credit))
          : undefined,
      debit_base:
        detail.debit_base !== undefined && detail.debit_base !== null
          ? parseFloat(String(detail.debit_base))
          : detail.debit !== undefined && detail.debit !== null
            ? parseFloat(String(detail.debit))
            : undefined,
      credit_base:
        detail.credit_base !== undefined && detail.credit_base !== null
          ? parseFloat(String(detail.credit_base))
          : detail.credit !== undefined && detail.credit !== null
            ? parseFloat(String(detail.credit))
            : undefined,
      gauge: parseFloat(detail.gauge) || 875,
      g_debit:
        detail.g_debit !== undefined && detail.g_debit !== null
          ? parseFloat(String(detail.g_debit))
          : detail.debit_g !== undefined && detail.debit_g !== null
            ? parseFloat(String(detail.debit_g))
            : undefined,
      g_credit:
        detail.g_credit !== undefined && detail.g_credit !== null
          ? parseFloat(String(detail.g_credit))
          : detail.credit_g !== undefined && detail.credit_g !== null
            ? parseFloat(String(detail.credit_g))
            : undefined,
      g_debit_base:
        detail.g_debit_base !== undefined && detail.g_debit_base !== null
          ? parseFloat(String(detail.g_debit_base))
          : undefined,
      g_credit_base:
        detail.g_credit_base !== undefined && detail.g_credit_base !== null
          ? parseFloat(String(detail.g_credit_base))
          : undefined,
      vouch_notes: detail.vouch_notes || "",
      cr_date: detail.cr_date || new Date().toISOString(),
    };
  });

  // Format voucher data
  const formattedVoucher: Voucher = {
    ...existingVoucher,
    vouch_date: existingVoucher.vouch_date || new Date().toISOString(),
    cr_date: existingVoucher.cr_date || new Date().toISOString(),
    vouch_id: existingVoucher.vouch_id || 0,
    ref_no: existingVoucher.ref_no || "",
    vouch_notes: existingVoucher.vouch_notes || "",
    vouch_status: existingVoucher.vouch_status || 1,
    pay_type: existingVoucher.pay_type || 1,
    vouch_type: 0, // Balance voucher type is always 0
    commit: existingVoucher.commit || false,
    post: existingVoucher.post || false,
    print: existingVoucher.print || false,
  };

  return {
    voucher: formattedVoucher,
    details,
  };
};

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

  try {
    const searchParamsData = await searchParams;
    const { mode, startInEdit } = parseBalanceVoucherParams(searchParamsData);

    // Fetch data in parallel for better performance
    const [existingVoucher, formData] = await Promise.all([
      getExistingBalanceVoucher(),
      getBalanceVoucherFormData(),
    ]);

    // If voucher exists, display it
    if (existingVoucher && existingVoucher.id) {
      const { voucher, details } = await loadBalanceVoucherData(
        existingVoucher,
        formData,
      );

      const formMode = mode === "edit" ? "edit" : "preview";

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
                          id:
                            existingVoucher.vouch_id || existingVoucher.id || "",
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
            key={`balance-${formMode}-${existingVoucher.id}`}
            fallback={<BalanceVoucherFormFallback />}
          >
            <BalanceVoucherClientPageWrapper
              formData={formData}
              formMode={formMode}
              isNewVoucher={false}
              startInEditMode={startInEdit}
              voucherData={voucher}
              voucherDetailsData={details}
              voucherRecordId={existingVoucher.id}
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
  } catch (error) {
    // Handle authentication errors
    if (error instanceof AuthenticationError) {
      await redirectToLogin();

      return null;
    }

    // Re-throw other errors to be handled by error boundary
    throw error;
  }
}
