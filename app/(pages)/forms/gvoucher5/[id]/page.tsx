import { notFound } from "next/navigation";
import { Metadata } from "next";
import { cache } from "react";

import CustomerGoldVoucherClientPage from "../../gvoucher4/CustomerGoldVoucherClientPage";

import voucherFormDataService from "@/services/bff/voucher-form-data.service";
import { voucherService } from "@/services/api";
import { Voucher, VoucherBox, GVoucherDetail } from "@/types/voucher";
import Breadcrumb from "@/components/Breadcrumb";

export const metadata: Metadata = {
  title: "عرض سند صرف عميل - NafeesWeb",
  description: "عرض وتعديل سند الصرف للعميل",
};

// Cache the voucher lookup for better performance
const getVoucherById = cache(async (voucherId: number) => {
  try {
    if (!voucherId || isNaN(voucherId)) {
      return null;
    }

    const vouchersResponse = await voucherService.getAll({
      xvouch_type: "5", // سند الصرف للعميل فقط
    });

    if (!vouchersResponse.success || !vouchersResponse.data) {
      return null;
    }

    const vouchers = Array.isArray(vouchersResponse.data)
      ? vouchersResponse.data
      : [];

    // البحث أولاً بـ id (primary key) ثم بـ vouch_id
    const foundVoucher = vouchers.find(
      (v: any) => v.id === voucherId || v.vouch_id === voucherId,
    );

    return foundVoucher || null;
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
        return [];
      }

      const parsedBranchId = Number(branchId ?? 1) || 1;

      const goldDetailsResponse = await voucherService.getGoldDetails(
        voucherId,
        {
          xcom_id: parsedBranchId,
        },
      );

      if (!goldDetailsResponse.success || !goldDetailsResponse.data) {
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
        return [];
      }

      const parsedBranchId = Number(branchId ?? 1) || 1;

      const boxesResponse = await voucherService.getBoxes(voucherId, {
        xcom_id: parsedBranchId,
      });

      if (!boxesResponse.success || !boxesResponse.data) {
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
      cost_name:
        costCenter?.name || costCenter?.cost_name || detail.cost_name || "",
      work_amt: parseFloat(detail.work_amt) || undefined,
      total_work: parseFloat(detail.total_work) || undefined,
      qty: parseInt(detail.qty) || undefined,
      vouch_status: detail.vouch_status || 1,
      cr_date: detail.cr_date || new Date().toISOString(),
    };
  });

  // معالجة الصناديق
  // ملاحظة: API يستخدم vouch (id من vouchers), box, vouch_amt, box_note, cost, inv
  const boxes: VoucherBox[] = boxesData.map((boxData: any) => {
    // معالجة box_id - قد يكون box (object أو ID) أو box_id
    let boxId = 0;
    let boxObject: VoucherBox["box"] = undefined;

    if (boxData.hasOwnProperty("box")) {
      // الحقل box موجود في الاستجابة
      if (boxData.box !== null && boxData.box !== undefined) {
        // إذا كان box object (يحتوي على id أو cust_name)
        if (typeof boxData.box === "object" && !Array.isArray(boxData.box)) {
          boxObject = {
            id: boxData.box.id || boxData.box.Id || 0,
            cust_name:
              boxData.box.cust_name ||
              boxData.box.name ||
              boxData.box.cust_name_e ||
              "",
            cust_code: boxData.box.cust_code || boxData.box.code || "",
            box_type: boxData.box.box_type || boxData.box.type_id || undefined,
          };
          boxId = boxObject.id;
        } else if (
          typeof boxData.box === "number" ||
          (typeof boxData.box === "string" && boxData.box !== "")
        ) {
          // إذا كان box ID فقط
          boxId = Number(boxData.box);
        }
      }
    }

    // إذا لم نحصل على box_id من box object، جرب box_id
    if (boxId === 0 && boxData.hasOwnProperty("box_id")) {
      if (
        boxData.box_id !== null &&
        boxData.box_id !== undefined &&
        boxData.box_id !== ""
      ) {
        boxId = Number(boxData.box_id);
      }
    }

    // معالجة cost_id - قد يكون cost أو cost_id
    let costId: number | null = null;

    if (boxData.hasOwnProperty("cost")) {
      if (
        boxData.cost !== null &&
        boxData.cost !== undefined &&
        boxData.cost !== ""
      ) {
        costId = Number(boxData.cost);
      }
    } else if (boxData.hasOwnProperty("cost_id")) {
      if (
        boxData.cost_id !== null &&
        boxData.cost_id !== undefined &&
        boxData.cost_id !== ""
      ) {
        costId = Number(boxData.cost_id);
      }
    }

    // معالجة inv_id
    let invId: number | null = null;

    if (boxData.hasOwnProperty("inv")) {
      if (
        boxData.inv !== null &&
        boxData.inv !== undefined &&
        boxData.inv !== ""
      ) {
        invId = Number(boxData.inv);
      }
    } else if (boxData.hasOwnProperty("inv_id")) {
      if (
        boxData.inv_id !== null &&
        boxData.inv_id !== undefined &&
        boxData.inv_id !== ""
      ) {
        invId = Number(boxData.inv_id);
      }
    }

    return {
      id: boxData.id || 0,
      vouch_id: boxData.vouch || boxData.vouch_id || targetVoucher.id || 0,
      box_id: boxId,
      box: boxObject, // معلومات الصندوق الكاملة إذا كانت موجودة
      amount: parseFloat(String(boxData.vouch_amt || boxData.amount || 0)),
      vouch_notes:
        boxData.box_note || boxData.vouch_notes || boxData.notes || "",
      cost_id: costId,
      inv_id: invId,
      close_weight: parseFloat(String(boxData.close_weight || 0)) || undefined,
      cr_date: boxData.cr_date || new Date().toISOString(),
    };
  });

  // تنسيق بيانات القيد
  // معالجة cust - قد يكون cust أو cust_id في API
  const custValue =
    targetVoucher.cust_id ||
    (targetVoucher as any).cust ||
    undefined;

  // معالجة cost_id - قد يكون cost (object أو ID) أو cost_id في API
  let costValue: number | null = null;
  
  if ((targetVoucher as any).cost_id !== undefined && (targetVoucher as any).cost_id !== null) {
    costValue = Number((targetVoucher as any).cost_id);
  } else if ((targetVoucher as any).cost !== undefined && (targetVoucher as any).cost !== null) {
    // إذا كان cost object (يحتوي على id)
    if (typeof (targetVoucher as any).cost === "object" && !Array.isArray((targetVoucher as any).cost)) {
      costValue = Number((targetVoucher as any).cost.id || (targetVoucher as any).cost.Id || 0);
    } else {
      // إذا كان cost ID مباشرة
      costValue = Number((targetVoucher as any).cost);
    }
  }

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
    handling: (targetVoucher as any).handling || "",
    print: targetVoucher.print || false,
    cust_id: custValue,
    cost_id: costValue && costValue > 0 ? costValue : null,
  };

  return (
    <div className="container mx-auto p-4">
      <Breadcrumb
        items={[
          { name: "سند صرف عميل", href: "/forms/gvoucher5" },
          {
            name:
              formMode === "edit"
                ? `تعديل ${targetVoucher.vouch_id || targetVoucher.id || ""}`
                : "معاينة",
          },
        ]}
      />
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
