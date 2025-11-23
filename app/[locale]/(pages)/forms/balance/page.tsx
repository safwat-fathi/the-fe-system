import { Metadata } from "next";
import { cache } from "react";

import BalanceVoucherClientPage from "./BalanceVoucherClientPage";

import voucherFormDataService from "@/services/bff/voucher-form-data.service";
import { voucherService } from "@/services/api";
import { Voucher, VoucherDetail } from "@/types/voucher";
import Breadcrumb from "@/components/Breadcrumb";

export const metadata: Metadata = {
  title: "قيد افتتاحي - NafeesWeb",
  description: "القيد الافتتاحي",
};

const getBalanceVoucherFormData =
  voucherFormDataService.getBalanceVoucherFormData;

// البحث عن القيد الافتتاحي الموجود (نوع 0)
const getExistingBalanceVoucher = cache(async () => {
  try {
    const vouchersResponse = await voucherService.getAll({
      xvouch_type: "0", // قيد افتتاحي فقط
    });

    if (vouchersResponse.success && vouchersResponse.data) {
      const vouchers = Array.isArray(vouchersResponse.data)
        ? vouchersResponse.data
        : [];

      // البحث عن أول قيد افتتاحي (vouch_type = 0) والتأكد من ذلك
      const balanceVoucher = vouchers.find(
        (v: any) => v?.vouch_type === 0 || v?.vouch_type === "0",
      );

      // إرجاع أول قيد افتتاحي موجود فقط
      return balanceVoucher || null;
    }

    return null;
  } catch (error) {
    // في حالة فشل الاتصال بالخادم، لا نوقف العملية
    // نعيد null حتى يتم عرض نموذج جديد
    console.warn(
      "[SERVER] ⚠️ فشل جلب القيد الافتتاحي (الخادم غير متاح):",
      error instanceof Error ? error.message : String(error),
    );

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
      console.error("Error fetching voucher details:", error);

      return [];
    }
  },
);

export default async function BalanceVoucherPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const searchParamsData = await searchParams;
  const mode = Array.isArray(searchParamsData.mode)
    ? searchParamsData.mode[0]
    : searchParamsData.mode;

  // جلب البيانات بشكل متوازي
  const [existingVoucher, formData] = await Promise.all([
    getExistingBalanceVoucher(),
    getBalanceVoucherFormData(),
  ]);

  // تحديد الوضع: edit أو preview
  const formMode = mode === "edit" ? "edit" : "preview";
  const startInEditMode = mode === "edit";

  // إذا كان القيد موجوداً، عرضه مباشرة (بدون redirect)
  if (existingVoucher && existingVoucher.id) {
    const branchId =
      Number(existingVoucher.com_id ?? existingVoucher.com ?? 1) || 1;
    const detailsData = await getVoucherDetails(existingVoucher.id, branchId);

    // معالجة تفاصيل القيد
    const details: VoucherDetail[] = detailsData.map((detail: any) => {
      const account = formData.accounts.find(
        (acc: any) => acc.id === (detail.acc_id || detail.acc),
      );

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
            : (detail.debit !== undefined && detail.debit !== null
              ? parseFloat(String(detail.debit))
              : undefined),
        credit_base:
          detail.credit_base !== undefined && detail.credit_base !== null
            ? parseFloat(String(detail.credit_base))
            : (detail.credit !== undefined && detail.credit !== null
              ? parseFloat(String(detail.credit))
              : undefined),
        gauge: parseFloat(detail.gauge) || 875,
        g_debit:
          detail.g_debit !== undefined && detail.g_debit !== null
            ? parseFloat(String(detail.g_debit))
            : (detail.debit_g !== undefined && detail.debit_g !== null
              ? parseFloat(String(detail.debit_g))
              : undefined),
        g_credit:
          detail.g_credit !== undefined && detail.g_credit !== null
            ? parseFloat(String(detail.g_credit))
            : (detail.credit_g !== undefined && detail.credit_g !== null
              ? parseFloat(String(detail.credit_g))
              : undefined),
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

    // تنسيق بيانات القيد
    const formattedVoucher: Voucher = {
      ...existingVoucher,
      vouch_date: existingVoucher.vouch_date || new Date().toISOString(),
      cr_date: existingVoucher.cr_date || new Date().toISOString(),
      vouch_id: existingVoucher.vouch_id || 0,
      ref_no: existingVoucher.ref_no || "",
      vouch_notes: existingVoucher.vouch_notes || "",
      vouch_status: existingVoucher.vouch_status || 1,
      pay_type: existingVoucher.pay_type || 1,
      vouch_type: 0, // القيد الافتتاحي نوعه دائماً 0
      commit: existingVoucher.commit || false,
      post: existingVoucher.post || false,
      print: existingVoucher.print || false,
    };

    return (
      <div className="container mx-auto p-4">
        <Breadcrumb
          items={[
            { name: "قيد افتتاحي", href: "/forms/balance" },
            {
              name:
                formMode === "edit"
                  ? `تعديل ${existingVoucher.vouch_id || existingVoucher.id || ""}`
                  : "معاينة",
            },
          ]}
        />
        <BalanceVoucherClientPage
          formData={formData}
          formMode={formMode}
          isNewVoucher={false}
          startInEditMode={startInEditMode}
          voucherData={formattedVoucher}
          voucherDetailsData={details}
          voucherRecordId={existingVoucher.id}
        />
      </div>
    );
  }

  // إذا لم يكن موجوداً، عرض نموذج جديد
  return (
    <div className="container mx-auto p-4">
      <Breadcrumb
        items={[
          { name: "القيود", href: "/forms/voucher?type=adjustment" },
          { name: "قيد افتتاحي", href: "/forms/balance" },
        ]}
      />
      <BalanceVoucherClientPage
        formData={formData}
        formMode="new"
        isNewVoucher={true}
      />
    </div>
  );
}
