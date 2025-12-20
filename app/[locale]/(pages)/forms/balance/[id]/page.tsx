import { notFound } from "next/navigation";
import { Metadata } from "next";
import { getTranslations } from "next-intl/server";

import BalanceVoucherClientPage from "../BalanceVoucherClientPage";
import VoucherStatusCheckboxes from "../components/VoucherStatusCheckboxes";

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

    // ✅ استخدام getVoucherById مباشرة للحصول على أحدث البيانات بدون cache
    const foundVoucher = await voucherService.getVoucherById(voucherId, {
      xvouch_type: "0", // قيد افتتاحي فقط
      xcom_id: "1",
    });

    // ✅ التحقق من أن القيد هو قيد افتتاحي
    if (foundVoucher && foundVoucher.vouch_type === 0) {
      return foundVoucher;
    }

    // ✅ Fallback: البحث بـ vouch_id إذا كان voucherId هو vouch_id وليس id
    if (foundVoucher && Number(foundVoucher.vouch_id) === voucherId) {
      // إذا كان القيد الموجود له نفس vouch_id، نعيده
      return foundVoucher;
    }

    // ✅ Fallback: محاولة البحث بـ vouch_id مباشرة
    const foundByVouchId = await voucherService.getVoucherById(voucherId, {
      xvouch_type: "0",
      xcom_id: "1",
    });

    if (
      foundByVouchId &&
      foundByVouchId.vouch_type === 0 &&
      Number(foundByVouchId.vouch_id) === voucherId
    ) {
      return foundByVouchId;
    }

    return null;
  } catch (error) {
    console.error("Error fetching voucher:", error);

    return null;
  }
}

// دالة لجلب تفاصيل القيد بدون cache
// سيتم إعادة التحقق من البيانات تلقائياً عند استخدام revalidatePath
async function getVoucherDetails(
  voucherId: number,
  branchId?: number | string,
) {
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
}

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
    // ✅ إذا كان القيد موجوداً (id > 0)، نعيّن commit: true في الـ state (للعرض فقط)
    // ملاحظة: commit في قاعدة البيانات قد لا يتغير، لكننا نعيّنه في الـ state للعرض
    commit:
      targetVoucher.commit ??
      (targetVoucher.id && targetVoucher.id > 0 ? true : false),
    post: targetVoucher.post ?? false, // ✅ post لا يُستخدم حالياً، سيتم استخدامه لاحقاً
    print: targetVoucher.print ?? false,
    cost_id:
      targetVoucher.cost_id ??
      ((targetVoucher as any).cost !== undefined
        ? (targetVoucher as any).cost
        : null),
  };

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
                      id: targetVoucher.vouch_id || targetVoucher.id || "",
                    })
                  : t("breadcrumbs.preview"),
            },
          ]}
        />
        {/* ✅ إضافة checkboxes دائماً */}
        <VoucherStatusCheckboxes
          commit={formattedVoucher.commit ?? false}
          post={formattedVoucher.post ?? false}
          print={formattedVoucher.print ?? false}
        />
      </div>
      <BalanceVoucherClientPage
        formData={formData}
        formMode={formMode}
        isNewVoucher={false}
        startInEditMode={startInEditMode}
        voucherData={formattedVoucher}
        voucherDetailsData={details}
        voucherRecordId={targetVoucher.id}
        voucherVouchId={targetVoucher.vouch_id || 0}
      />
    </div>
  );
}
