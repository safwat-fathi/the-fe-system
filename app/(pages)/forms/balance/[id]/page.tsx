import { notFound } from "next/navigation";
import { Metadata } from "next";
import { cache } from "react";

import BalanceVoucherClientPage from "../BalanceVoucherClientPage";

import voucherFormDataService from "@/services/bff/voucher-form-data.service";
import { voucherService } from "@/services/api";
import { Voucher, VoucherDetail } from "@/types/voucher";
import Breadcrumb from "@/components/Breadcrumb";

export const metadata: Metadata = {
  title: "عرض قيد افتتاحي - NafeesWeb",
  description: "عرض وتعديل القيد الافتتاحي",
};

// Cache the voucher lookup for better performance
const getVoucherById = cache(async (voucherId: number) => {
  try {
    if (!voucherId || isNaN(voucherId)) {
      console.warn("Invalid voucherId:", voucherId);
      return null;
    }

    const vouchersResponse = await voucherService.getAll({
      xvouch_type: "0", // قيد افتتاحي فقط
    });

    if (!vouchersResponse.success || !vouchersResponse.data) {
      console.warn("Failed to fetch vouchers:", vouchersResponse);
      return null;
    }

    const vouchers = Array.isArray(vouchersResponse.data)
      ? vouchersResponse.data
      : [];

    // البحث أولاً بـ id (primary key) ثم بـ vouch_id
    const foundVoucher = vouchers.find(
      (v: any) => v.id === voucherId || v.vouch_id === voucherId,
    );

    if (!foundVoucher) {
      console.warn("Voucher not found with id or vouch_id:", voucherId);
    }

    return foundVoucher;
  } catch (error) {
    console.error("Error fetching voucher:", error);
    return null;
  }
});

// Cache the voucher details for better performance
const getVoucherDetails = cache(
  async (voucherId: number, branchId?: number | string) => {
    try {
      if (!voucherId || isNaN(voucherId)) {
        console.warn("Invalid voucherId:", voucherId);

        return [];
      }

      const parsedBranchId = Number(branchId ?? 1) || 1;

      const detailsResponse = await voucherService.getDetails(voucherId, {
        xcom_id: parsedBranchId,
      });

      if (!detailsResponse.success || !detailsResponse.data) {
        console.warn("Failed to fetch voucher details:", detailsResponse);

        return [];
      }

      return Array.isArray(detailsResponse.data) ? detailsResponse.data : [];
    } catch (error) {
      console.error("Error fetching voucher details:", error);

      return [];
    }
  },
);

export default async function BalanceVoucherEditPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
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
    getVoucherById(voucherId),
    voucherFormDataService.getBalanceVoucherFormData(),
  ]);

  if (!targetVoucher) {
    notFound();
  }

  // التحقق من أن القيد هو قيد افتتاحي
  if (targetVoucher.vouch_type !== 0) {
    notFound();
  }

  // جلب تفاصيل القيد
  const branchId = Number(targetVoucher.com_id ?? targetVoucher.com ?? 1) || 1;
  const detailsData = await getVoucherDetails(targetVoucher.id, branchId);


  // معالجة تفاصيل القيد
  // ملاحظة: API يستخدم vouch (id من vouchers), acc, cost
  const details: VoucherDetail[] = detailsData.map((detail: any) => {
    const account = formData.accounts.find(
      (acc: any) => acc.id === (detail.acc_id || detail.acc),
    );

    return {
      id: detail.id || 0,
      vouch_id: targetVoucher.vouch_id || 0, // vouch_id من voucher الرئيسي
      acc_id: detail.acc_id || detail.acc || 0, // API يعيد acc
      acc_code: (account as any)?.acc_code || detail.acc_code || "",
      acc_name: (account as any)?.acc_name || detail.acc_name || "",
      cost_id: detail.cost_id || detail.cost || 0, // API يعيد cost
      debit:
        detail.debit !== undefined && detail.debit !== null
          ? parseFloat(String(detail.debit))
          : undefined,
      credit:
        detail.credit !== undefined && detail.credit !== null
          ? parseFloat(String(detail.credit))
          : undefined,
      base_debit:
        detail.base_debit !== undefined && detail.base_debit !== null
          ? parseFloat(String(detail.base_debit))
          : undefined,
      base_credit:
        detail.base_credit !== undefined && detail.base_credit !== null
          ? parseFloat(String(detail.base_credit))
          : undefined,
      gauge: parseFloat(detail.gauge) || 875,
      debit_g:
        detail.debit_g !== undefined && detail.debit_g !== null
          ? parseFloat(String(detail.debit_g))
          : undefined,
      credit_g:
        detail.credit_g !== undefined && detail.credit_g !== null
          ? parseFloat(String(detail.credit_g))
          : undefined,
      vouch_notes: detail.vouch_notes || "",
      cr_date: detail.cr_date || new Date().toISOString(),
    };
  });

  // تنسيق بيانات القيد
  const formattedVoucher: Voucher = {
    ...targetVoucher,
    vouch_date: targetVoucher.vouch_date || new Date().toISOString(),
    cr_date: targetVoucher.cr_date || new Date().toISOString(),
    vouch_id: targetVoucher.vouch_id || 0,
    ref_no: targetVoucher.ref_no || "",
    vouch_notes: targetVoucher.vouch_notes || "",
    vouch_status: targetVoucher.vouch_status || 1,
    pay_type: targetVoucher.pay_type || 1,
    vouch_type: 0, // القيد الافتتاحي نوعه دائماً 0
    commit: targetVoucher.commit || false,
    post: targetVoucher.post || false,
    print: targetVoucher.print || false,
  };

  return (
    <div className="container mx-auto p-4">
      <Breadcrumb
        items={[
          { name: "القيود", href: "/forms/voucher?type=adjustment" },
          { name: "قيد افتتاحي", href: "/forms/balance" },
          {
            name:
              formMode === "edit"
                ? `تعديل ${targetVoucher.vouch_id || targetVoucher.id || ""}`
                : "معاينة",
          },
        ]}
      />
      <BalanceVoucherClientPage
        formData={formData}
        formMode={formMode}
        isNewVoucher={false}
        voucherData={formattedVoucher}
        voucherDetailsData={details}
        voucherRecordId={targetVoucher.id}
      />
    </div>
  );
}
