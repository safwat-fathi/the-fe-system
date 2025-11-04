import { notFound } from "next/navigation";
import { Metadata } from "next";
import { cache } from "react";

import VoucherClientPage from "../VoucherClientPage";

import voucherFormDataService from "@/services/bff/voucher-form-data.service";
import { voucherService } from "@/services/api";
import { Voucher, VoucherDetail } from "@/types/voucher";
import Breadcrumb from "@/components/Breadcrumb";

export const metadata: Metadata = {
  title: "تعديل قيد تسوية - NafeesWeb",
  description: "عرض وتعديل قيد التسوية",
};

// Cache the voucher lookup for better performance (مثل voucher1 و gvoucher4)
const getVoucherById = cache(async (voucherId: number) => {
  try {
    if (!voucherId || isNaN(voucherId)) {
      console.warn("Invalid voucherId:", voucherId);

      return null;
    }

    const vouchersResponse = await voucherService.getAll({
      xvouch_type: "3", // قيد التسوية فقط
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

export default async function VoucherEditPage({
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
    voucherFormDataService.getVoucherFormData(),
  ]);

  if (!targetVoucher) {
    notFound();
  }

  // جلب تفاصيل القيد - استخدام id (primary key) من targetVoucher
  const branchId = Number(targetVoucher.com_id ?? targetVoucher.com ?? 1) || 1;
  // استخدام id (primary key) لجلب التفاصيل (مثل voucher1 و gvoucher4)
  const [detailsData] = await Promise.all([
    getVoucherDetails(targetVoucher.id, branchId),
  ]);

  // معالجة تفاصيل القيد
  // ملاحظة: API يستخدم vouch (id من vouchers), acc, cost
  const details: VoucherDetail[] = detailsData.map((detail: any) => {
    const account = formData.accounts.find(
      (acc: any) => acc.id === (detail.acc_id || detail.acc),
    );

    // معالجة cost_id - قد يكون cost أو cost_id، وأحياناً يكون null
    let costId: number | undefined = undefined;

    if (detail.hasOwnProperty("cost")) {
      // الحقل cost موجود في الاستجابة (حتى لو null)
      if (
        detail.cost !== null &&
        detail.cost !== undefined &&
        detail.cost !== ""
      ) {
        costId = Number(detail.cost);
      }
    } else if (detail.hasOwnProperty("cost_id")) {
      // الحقل cost_id موجود في الاستجابة
      if (
        detail.cost_id !== null &&
        detail.cost_id !== undefined &&
        detail.cost_id !== ""
      ) {
        costId = Number(detail.cost_id);
      }
    }

    return {
      id: detail.id || 0,
      vouch_id: targetVoucher.vouch_id || 0, // vouch_id من voucher الرئيسي
      acc_id: detail.acc_id || detail.acc || 0,
      acc_code: (account as any)?.acc_code || detail.acc_code || "",
      acc_name: (account as any)?.acc_name || detail.acc_name || "",
      cost_id: costId, // قد يكون undefined أو رقم
      debit: parseFloat(detail.debit) || 0,
      credit: parseFloat(detail.credit) || 0,
      debit_g: parseFloat(detail.debit_g) || 0,
      credit_g: parseFloat(detail.credit_g) || 0,
      gauge: parseFloat(detail.gauge) || 875,
      tax: parseFloat(detail.tax) || 0,
      tax_prc: parseFloat(detail.tax_prc) || 0,
      vat_no: parseInt(detail.vat_no) || 0,
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
    vouch_amt: targetVoucher.vouch_amt || 0,
    ref_no: targetVoucher.ref_no || "",
    vouch_notes: targetVoucher.vouch_notes || "",
    vouch_status: targetVoucher.vouch_status || 1,
    pay_type: targetVoucher.pay_type || 1,
    commit: targetVoucher.commit || false,
    post: targetVoucher.post || false,
    print: targetVoucher.print || false,
  };

  // تحديد عنوان القيد بناءً على النوع
  const getVoucherTitle = (vouchType: number) => {
    switch (vouchType) {
      case 1:
        return "سند قبض";
      case 2:
        return "سند صرف";
      case 3:
        return "قيد تسوية";
      default:
        return "قيد";
    }
  };

  const voucherTitle = getVoucherTitle(formattedVoucher.vouch_type || 3);
  const newVoucherHref = `/forms/voucher?type=${
    formattedVoucher.vouch_type === 1
      ? "receipt"
      : formattedVoucher.vouch_type === 2
        ? "payment"
        : "adjustment"
  }&mode=new`;

  return (
    <div className="container mx-auto p-4">
      <Breadcrumb
        items={[
          { name: voucherTitle, href: newVoucherHref },
          {
            name:
              formMode === "edit"
                ? `تعديل ${targetVoucher.vouch_id || targetVoucher.id || ""}`
                : "معاينة",
          },
        ]}
      />
      <VoucherClientPage
        accounts={formData.accounts}
        caratTypes={formData.caratTypes}
        costCenters={formData.costCenters}
        formMode={formMode}
        isNewVoucher={false}
        newVoucherHref={newVoucherHref}
        startInEditMode={startInEditMode}
        vouchType={formattedVoucher.vouch_type}
        voucherData={formattedVoucher}
        voucherDetailsData={details}
        voucherRecordId={targetVoucher.id}
        voucherStatuses={formData.voucherStatuses}
        voucherTypes={formData.voucherTypes}
      />
    </div>
  );
}
