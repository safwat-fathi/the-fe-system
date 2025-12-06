import { notFound } from "next/navigation";
import { Metadata } from "next";
import { cache } from "react";
import { getTranslations } from "next-intl/server";

import BalanceVoucherClientPage from "../BalanceVoucherClientPage";

import voucherFormDataService from "@/services/bff/voucher-form-data.service";
import { voucherService } from "@/services/api";
import { Voucher, VoucherDetail } from "@/types/voucher";
import Breadcrumb from "@/components/Breadcrumb";

export const metadata: Metadata = {
  title: "عرض قيد افتتاحي - NafeesWeb",
  description: "عرض وتعديل القيد الافتتاحي",
};

// دالة بسيطة لجلب القيد بدون cache
async function getVoucherById(voucherId: number) {
  try {
    if (!voucherId || isNaN(voucherId)) {
      return null;
    }

    // جلب جميع القيود الافتتاحية والبحث محلياً
    const vouchersResponse = await voucherService.getAll({
      xvouch_type: "0", // قيد افتتاحي فقط
      xcom_id: "1",
    });

    if (vouchersResponse.success && vouchersResponse.data) {
      const vouchers = Array.isArray(vouchersResponse.data)
        ? vouchersResponse.data
        : [];

      // البحث أولاً بـ id (primary key) والتحقق من vouch_type = 0
      const foundVoucher = vouchers.find(
        (v: any) =>
          Number(v?.id) === voucherId &&
          (v?.vouch_type === 0 || v?.vouch_type === "0"),
      );

      if (foundVoucher) {
        return foundVoucher;
      }

      // البحث بـ vouch_id كـ fallback والتحقق من vouch_type = 0
      const foundByVouchId = vouchers.find(
        (v: any) =>
          Number(v?.vouch_id) === voucherId &&
          (v?.vouch_type === 0 || v?.vouch_type === "0"),
      );

      if (foundByVouchId) {
        return foundByVouchId;
      }
    }

    return null;
  } catch (error) {
    console.error("Error fetching voucher:", error);

    return null;
  }
}

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

export default async function BalanceVoucherEditPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const t = await getTranslations("forms.balanceVoucher");
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
    // إذا لم يتم العثور على القيد، حاول مرة أخرى بعد تأخير قصير
    // هذا قد يكون مفيداً إذا كان القيد حديث الإضافة
    console.warn(
      `[Balance Voucher] Voucher with ID ${voucherId} not found, retrying...`,
    );
    notFound();
  }

  // التحقق من أن القيد هو قيد افتتاحي
  if (targetVoucher.vouch_type !== 0) {
    console.warn(
      `[Balance Voucher] Voucher ${voucherId} is not an opening entry (type: ${targetVoucher.vouch_type})`,
    );
    notFound();
  }

  // جلب تفاصيل القيد
  // استخدام id (primary key) من جدول vouchers
  const branchId = Number(targetVoucher.com_id ?? targetVoucher.com ?? 1) || 1;
  const voucherMasterId = targetVoucher.id; // primary key من جدول vouchers

  if (!voucherMasterId || voucherMasterId <= 0) {
    console.error(
      `[Balance Voucher] Invalid voucher master ID: ${voucherMasterId}`,
    );
    notFound();
  }

  const detailsData = await getVoucherDetails(voucherMasterId, branchId);

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
    cost_id: targetVoucher.cost ?? targetVoucher.cost_id ?? null,
  };

  return (
    <div className="container mx-auto p-4">
      <Breadcrumb
        items={[
          { name: t("breadcrumbs.list"), href: "/forms/balance" },
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
      <BalanceVoucherClientPage
        formData={formData}
        formMode={formMode}
        isNewVoucher={false}
        startInEditMode={startInEditMode}
        voucherData={formattedVoucher}
        voucherDetailsData={details}
        voucherRecordId={targetVoucher.id}
      />
    </div>
  );
}
