import { notFound } from "next/navigation";
import { Metadata } from "next";
import { cache } from "react";

import BalanceVoucherClientPage from "./BalanceVoucherClientPage";

import voucherFormDataService from "@/services/bff/voucher-form-data.service";
import { voucherService } from "@/services/api";
import { Voucher, VoucherDetail } from "@/types/voucher";
import { getBranchParams } from "@/app/actions/branch-params";

export const metadata: Metadata = {
  title: "عرض قيد افتتاحي - NafeesWeb",
  description: "عرض وتعديل القيد الافتتاحي",
};

// Cache the voucher lookup for better performance
const getVoucherById = cache(async (voucherId: number, branchId?: string) => {
  try {
    if (!voucherId || isNaN(voucherId)) {
      console.warn("Invalid voucherId:", voucherId);

      return null;
    }

    const comId = branchId || "1";

    console.log("🔍 Searching for voucher:", { voucherId, branchId: comId });

    // أولاً: جلب جميع القيود الافتتاحية للفرع (بدون فلتر xvouch_id)
    // لأن xvouch_id يبحث بـ vouch_id وليس id (primary key)
    let vouchersResponse = await voucherService.getAll({
      xvouch_type: "0", // قيد افتتاحي
      xvouch_id: "0", // "0" يعني جميع القيود
      xcom_id: comId,
      xyear_id: "0",
    });

    let vouchers: any[] = [];

    if (vouchersResponse.success && vouchersResponse.data) {
      vouchers = Array.isArray(vouchersResponse.data)
        ? vouchersResponse.data
        : [];
    }

    console.log("📋 Found vouchers (type 0):", vouchers.length);

    // البحث أولاً بـ id (primary key) - هذا الأهم
    let foundVoucher = vouchers.find(
      (v: any) => v.id === voucherId && v.vouch_type === 0,
    );

    if (foundVoucher) {
      console.log("✅ Found voucher by id:", foundVoucher.id);
      return foundVoucher;
    }

    // إذا لم نجد، نجرب البحث بـ vouch_id
    foundVoucher = vouchers.find(
      (v: any) => v.vouch_id === voucherId && v.vouch_type === 0,
    );

    if (foundVoucher) {
      console.log("✅ Found voucher by vouch_id:", foundVoucher.vouch_id);
      return foundVoucher;
    }

    // محاولة ثانية: جلب جميع القيود بدون فلتر النوع
    if (!foundVoucher) {
      vouchersResponse = await voucherService.getAll({
        xcom_id: comId,
      });

      if (vouchersResponse.success && vouchersResponse.data) {
        const allVouchers = Array.isArray(vouchersResponse.data)
          ? vouchersResponse.data
          : [];

        console.log("📋 Found all vouchers:", allVouchers.length);

        foundVoucher = allVouchers.find(
          (v: any) => (v.id === voucherId || v.vouch_id === voucherId) && v.vouch_type === 0,
        );
      }
    }

    // محاولة أخيرة: البحث في جميع القيود بدون أي فلتر
    if (!foundVoucher) {
      const lastAttempt = await voucherService.getAll();

      if (lastAttempt.success && lastAttempt.data) {
        const allVouchers = Array.isArray(lastAttempt.data)
          ? lastAttempt.data
          : [];

        console.log("📋 Found all vouchers (no filters):", allVouchers.length);

        foundVoucher = allVouchers.find(
          (v: any) => (v.id === voucherId || v.vouch_id === voucherId) && v.vouch_type === 0,
        );
      }
    }

    if (foundVoucher) {
      console.log("✅ Found voucher in fallback:", foundVoucher.id || foundVoucher.vouch_id);
      return foundVoucher;
    }

    console.warn("❌ Voucher not found:", voucherId);
    return null;
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

  const voucherId = parseInt(id);

  // التحقق من صحة المعرف
  if (isNaN(voucherId) || voucherId <= 0) {
    notFound();
  }

  // الحصول على معاملات الفرع
  const branchParams = await getBranchParams();
  const branchId = branchParams.com || "1";

  // جلب البيانات بشكل متوازي
  const [targetVoucher, formData] = await Promise.all([
    getVoucherById(voucherId, branchId),
    voucherFormDataService.getVoucherFormData(),
  ]);

  if (!targetVoucher) {
    notFound();
  }

  // التحقق من أن القيد هو قيد افتتاحي
  if (targetVoucher.vouch_type !== 0) {
    notFound();
  }

  // جلب تفاصيل القيد - استخدام id من targetVoucher
  // استخدام branchId الذي تم تعريفه سابقاً، أو com_id من القيد إذا كان مختلفاً
  const voucherBranchId = Number(targetVoucher.com_id ?? targetVoucher.com ?? branchId) || branchId;
  const detailsData = await getVoucherDetails(targetVoucher.id, voucherBranchId);

  // معالجة تفاصيل القيد
  const details: VoucherDetail[] = detailsData.map((detail: any) => {
    const account = formData.accounts.find(
      (acc: any) => acc.id === (detail.acc_id || detail.acc),
    );

    return {
      id: detail.id || 0,
      vouch_id: detail.vouch_id || targetVoucher.vouch_id || 0,
      acc_id: detail.acc_id || detail.acc || 0,
      acc_code: (account as any)?.acc_code || detail.acc_code || "",
      acc_name: (account as any)?.acc_name || detail.acc_name || "",
      cost_id: detail.cost_id || 0,
      debit:
        detail.debit !== undefined && detail.debit !== null
          ? parseFloat(String(detail.debit))
          : undefined,
      credit:
        detail.credit !== undefined && detail.credit !== null
          ? parseFloat(String(detail.credit))
          : undefined,
      debit_g:
        detail.debit_g !== undefined && detail.debit_g !== null
          ? parseFloat(String(detail.debit_g))
          : undefined,
      credit_g:
        detail.credit_g !== undefined && detail.credit_g !== null
          ? parseFloat(String(detail.credit_g))
          : undefined,
      gauge: parseFloat(detail.gauge) || 875,
      // لا توجد ضريبة في القيد الافتتاحي
      tax: undefined,
      tax_prc: undefined,
      vat_no: undefined,
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
    <BalanceVoucherClientPage
      formData={formData}
      formMode={formMode}
      voucherData={formattedVoucher}
      voucherDetailsData={details}
      voucherRecordId={targetVoucher.id}
    />
  );
}
