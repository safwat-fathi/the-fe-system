import { notFound } from "next/navigation";
import { Metadata } from "next";
import { cache } from "react";

import CashReceiptVoucherClientPage from "../CashReceiptVoucherClientPage";

import voucherFormDataService from "@/services/bff/voucher-form-data.service";
import { voucherService } from "@/services/api";
import { Voucher, VoucherDetail, VoucherBox } from "@/types/voucher";
import Breadcrumb from "@/components/Breadcrumb";

export const metadata: Metadata = {
  title: "عرض سند قبض - NafeesWeb",
  description: "عرض وتعديل سند القبض",
};

// Cache the voucher lookup for better performance
const getVoucherById = cache(async (voucherId: number) => {
  try {
    if (!voucherId || isNaN(voucherId)) {
      console.warn("Invalid voucherId:", voucherId);

      return null;
    }

    const vouchersResponse = await voucherService.getAll({
      xvouch_type: "1", // سند القبض فقط
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

// Cache the voucher boxes for better performance
const getVoucherBoxes = cache(
  async (voucherId: number, branchId?: number | string) => {
    try {
      if (!voucherId || isNaN(voucherId)) {
        console.warn("Invalid voucherId:", voucherId);

        return [];
      }

      const parsedBranchId = Number(branchId ?? 1) || 1;

      const boxesResponse = await voucherService.getBoxes(voucherId, {
        xcom_id: parsedBranchId,
      });

      if (!boxesResponse.success || !boxesResponse.data) {
        console.warn("Failed to fetch voucher boxes:", boxesResponse);

        return [];
      }

      return Array.isArray(boxesResponse.data) ? boxesResponse.data : [];
    } catch (error) {
      console.error("Error fetching voucher boxes:", error);

      return [];
    }
  },
);

export default async function ReceiptVoucherEditPage({
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

  // جلب تفاصيل القيد والصناديق بشكل متوازي
  const branchId = Number(targetVoucher.com_id ?? targetVoucher.com ?? 1) || 1;
  const [detailsData, boxesData] = await Promise.all([
    getVoucherDetails(targetVoucher.id, branchId),
    getVoucherBoxes(targetVoucher.id, branchId),
  ]);

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
      debit: parseFloat(detail.debit) || 0,
      credit: parseFloat(detail.credit) || 0,
      debit_g: parseFloat(detail.debit_g) || 0,
      credit_g: parseFloat(detail.credit_g) || 0,
      gauge: parseFloat(detail.gauge) || 875,
      vouch_notes: detail.vouch_notes || "",
      cr_date: detail.cr_date || new Date().toISOString(),
    };
  });

  // معالجة الصناديق
  // ملاحظة: API يستخدم vouch (id من vouchers), box, vouch_amt, box_note, cost, inv
  const boxes: VoucherBox[] = boxesData.map((box: any) => ({
    id: box.id || 0,
    vouch_id: box.vouch || targetVoucher.id || 0, // API يعيد vouch (id من vouchers)
    box_id: box.box || 0, // API يعيد box (box_id)
    amount: parseFloat(box.vouch_amt || box.amount || 0), // API يعيد vouch_amt
    vouch_notes: box.box_note || box.vouch_notes || "", // API يعيد box_note
    cost_id: box.cost || box.cost_id || null, // API يعيد cost
    inv_id: box.inv || box.inv_id || null, // API يعيد inv
    cr_date: box.cr_date || new Date().toISOString(),
  }));

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
    commit: targetVoucher.commit || false,
    post: targetVoucher.post || false,
    print: targetVoucher.print || false,
  };

  return (
    <div className="container mx-auto p-4">
      <Breadcrumb
        items={[
          { name: "القيود", href: "/forms/voucher?type=adjustment" },
          { name: "سند قبض", href: "/forms/voucher1" },
          {
            name:
              formMode === "edit"
                ? `تعديل ${targetVoucher.vouch_id || targetVoucher.id || ""}`
                : "معاينة",
          },
        ]}
      />
      <CashReceiptVoucherClientPage
        accounts={formData.accounts}
        boxes={formData.boxes}
        costCenters={formData.costCenters}
        formMode={formMode}
        isNewVoucher={false}
        startInEditMode={startInEditMode}
        vouchType={1}
        voucherBoxes={boxes}
        voucherData={formattedVoucher}
        voucherDetailsData={details}
        voucherRecordId={targetVoucher.id}
        voucherStatuses={formData.voucherStatuses}
        voucherTypes={formData.voucherTypes}
      />
    </div>
  );
}

