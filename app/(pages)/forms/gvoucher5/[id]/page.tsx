import { notFound } from "next/navigation";
import { Metadata } from "next";
import { cache } from "react";

import CustomerGoldVoucherClientPage from "../../gvoucher4/CustomerGoldVoucherClientPage";

import voucherFormDataService from "@/services/bff/voucher-form-data.service";
import { voucherService } from "@/services/api";
import { Voucher, VoucherBox, GVoucherDetail } from "@/types/voucher";

export const metadata: Metadata = {
  title: "عرض سند صرف عميل - NafeesWeb",
  description: "عرض وتعديل سند الصرف للعميل",
};

// Cache the voucher lookup for better performance
const getVoucherById = cache(async (voucherId: number) => {
  try {
    if (!voucherId || isNaN(voucherId)) {
      console.warn("Invalid voucherId:", voucherId);

      return null;
    }

    const vouchersResponse = await voucherService.getAll({
      xvouch_type: "5", // سند الصرف للعميل فقط
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

// Cache the gold details for better performance
const getGoldDetails = cache(
  async (voucherId: number, branchId?: number | string) => {
    try {
      if (!voucherId || isNaN(voucherId)) {
        console.warn("Invalid voucherId:", voucherId);

        return [];
      }

      const parsedBranchId = Number(branchId ?? 1) || 1;

      const goldDetailsResponse = await voucherService.getGoldDetails(voucherId, {
        xcom_id: parsedBranchId,
      });

      if (!goldDetailsResponse.success || !goldDetailsResponse.data) {
        console.warn("Failed to fetch gold details:", goldDetailsResponse);

        return [];
      }

      return Array.isArray(goldDetailsResponse.data)
        ? goldDetailsResponse.data
        : [];
    } catch (error) {
      console.error("Error fetching gold details:", error);

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

export default async function CustomerPaymentVoucherEditPage({
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

  // جلب تفاصيل الذهب والصناديق بشكل متوازي
  const branchId = Number(targetVoucher.com_id ?? targetVoucher.com ?? 1) || 1;
  const [goldDetailsData, boxesData] = await Promise.all([
    getGoldDetails(targetVoucher.id, branchId),
    getVoucherBoxes(targetVoucher.id, branchId),
  ]);

  // معالجة تفاصيل الذهب
  // ملاحظة: API يستخدم vouch (id من vouchers), item, box, cost, inv
  const goldDetails: GVoucherDetail[] = goldDetailsData.map((detail: any) => {
    const item = formData.items?.find(
      (itm: any) => itm.id === (detail.item_id || detail.item),
    );
    const box = formData.boxes?.find(
      (bx: any) => bx.id === (detail.box_id || detail.box),
    );
    const costCenter = formData.costCenters.find(
      (cc: any) => cc.id === (detail.cost_id || detail.cost),
    );

    return {
      id: detail.id || 0,
      vouch_id: targetVoucher.vouch_id || 0,
      item_id: detail.item_id || detail.item || 0,
      item_code: item?.item_code || detail.item_code || "",
      item_name: item?.item_name || detail.item_name || "",
      k: parseFloat(detail.k) || undefined,
      weight: parseFloat(detail.weight) || undefined,
      g_weight: parseFloat(detail.g_weight) || undefined,
      weight2: parseFloat(detail.weight2) || undefined,
      g_weight2: parseFloat(detail.g_weight2) || undefined,
      box_id: detail.box_id || detail.box || undefined,
      box_name: box?.cust_name || box?.name || detail.box_name || "",
      notes: detail.notes || detail.vouch_notes || "",
      diff: parseFloat(detail.diff) || undefined,
      close_amt: parseFloat(detail.close_amt) || undefined,
      close_weight: parseFloat(detail.close_weight) || undefined,
      inv_id: detail.inv_id || detail.inv || undefined,
      cost_id: detail.cost_id || detail.cost || undefined,
      cost_name: costCenter?.name || costCenter?.cost_name || detail.cost_name || "",
      work_amt: parseFloat(detail.work_amt) || undefined,
      total_work: parseFloat(detail.total_work) || undefined,
      qty: parseInt(detail.qty) || undefined,
      vouch_status: detail.vouch_status || 1,
      cr_date: detail.cr_date || new Date().toISOString(),
    };
  });

  // معالجة الصناديق
  // ملاحظة: API يستخدم vouch (id من vouchers), box, vouch_amt, box_note, cost, inv
  const boxes: VoucherBox[] = boxesData.map((box: any) => ({
    id: box.id || 0,
    vouch_id: box.vouch || targetVoucher.id || 0,
    box_id: box.box || 0,
    amount: parseFloat(box.vouch_amt || box.amount || 0),
    vouch_notes: box.box_note || box.vouch_notes || "",
    cost_id: box.cost || box.cost_id || null,
    inv_id: box.inv || box.inv_id || null,
    vat_no: box.vat_no || undefined,
    tax_prc: parseFloat(box.tax_prc) || undefined,
    tax: parseFloat(box.tax) || undefined,
    close_weight: parseFloat(box.close_weight) || undefined,
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
    cust_id: targetVoucher.cust_id || undefined,
  };

  return (
    <div className="container mx-auto p-4">
      <CustomerGoldVoucherClientPage
        accounts={formData.accounts}
        boxes={formData.boxes || []}
        costCenters={formData.costCenters}
        customers={formData.customers || []}
        formMode={formMode}
        goldDetailsData={goldDetails}
        isNewVoucher={false}
        items={formData.items || []}
        startInEditMode={startInEditMode}
        vouchType={5}
        voucherBoxes={boxes}
        voucherData={formattedVoucher}
        voucherRecordId={targetVoucher.id}
        voucherTypes={formData.voucherTypes}
      />
    </div>
  );
}

