import { redirect } from "next/navigation";
import { Metadata } from "next";
import { cache } from "react";

import BalanceVoucherNewClient from "./BalanceVoucherNewClient";
import voucherFormDataService from "@/services/bff/voucher-form-data.service";
import { voucherService } from "@/services/api";
import { getBranchParams } from "@/app/actions/branch-params";

export const metadata: Metadata = {
  title: "قيد افتتاحي جديد - NafeesWeb",
  description: "إنشاء قيد افتتاحي جديد",
};

// Cache the lookup for better performance
const getExistingBalanceVoucher = cache(async (branchId: string) => {
  try {
    // البحث عن القيد الافتتاحي للفرع الحالي
    const vouchersResponse = await voucherService.getAll({
      xvouch_type: "0", // قيد افتتاحي
      xvouch_id: "0",
      xcom_id: branchId,
      xyear_id: "0",
    });

    if (vouchersResponse.success && vouchersResponse.data) {
      const vouchers = Array.isArray(vouchersResponse.data)
        ? vouchersResponse.data
        : [];

      // البحث عن القيد الافتتاحي للفرع المحدد
      const existingVoucher = vouchers.find(
        (v: any) => v.vouch_type === 0,
      );

      return existingVoucher || null;
    }

    return null;
  } catch (error) {
    console.error("Error fetching existing balance voucher:", error);
    return null;
  }
});

export default async function BalanceVoucherPage() {
  // الحصول على معاملات الفرع
  const branchParams = await getBranchParams();
  const branchId = branchParams.com || "1";

  // التحقق من وجود قيد افتتاحي موجود
  const existingVoucher = await getExistingBalanceVoucher(branchId);

  // إذا وُجد قيد افتتاحي، إعادة التوجيه إلى صفحة القيد الموجود
  if (existingVoucher) {
    const voucherId = existingVoucher.id || existingVoucher.vouch_id;
    
    if (voucherId) {
      redirect(`/forms/balance/${voucherId}?mode=preview`);
    }
  }

  // إذا لم يوجد قيد افتتاحي، عرض صفحة القيد الجديد الفارغة
  const formData = await voucherFormDataService.getVoucherFormData();

  return <BalanceVoucherNewClient formData={formData} />;
}
