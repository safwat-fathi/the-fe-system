import { notFound } from "next/navigation";
import { Metadata } from "next";
import { cache } from "react";

import CashReceiptVoucherClientPage from "../../voucher1/CashReceiptVoucherClientPage";

import voucherFormDataService from "@/services/bff/voucher-form-data.service";
import { voucherService } from "@/services/api";
import { Voucher, VoucherDetail, VoucherBox } from "@/types/voucher";
import Breadcrumb from "@/components/Breadcrumb";

export const metadata: Metadata = {
  title: "عرض سند صرف - NafeesWeb",
  description: "عرض وتعديل سند الصرف",
};

// Cache the voucher lookup for better performance
const getVoucherById = cache(async (voucherId: number) => {
  try {
    if (!voucherId || isNaN(voucherId)) {
      return null;
    }

    const vouchersResponse = await voucherService.getAll({
      xvouch_type: "2", // سند الصرف فقط
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

      const boxes = Array.isArray(boxesResponse.data) ? boxesResponse.data : [];

      return boxes;
    } catch (error) {
      console.error("Error fetching voucher boxes:", error);

      return [];
    }
  },
);

export default async function PaymentVoucherEditPage({
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

    // معالجة cost_id - قد يكون cost أو cost_id، وأحياناً يكون null
    let costId: number | null = null;

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
      acc_id: detail.acc_id || detail.acc || 0, // API يعيد acc
      acc_code: (account as any)?.acc_code || detail.acc_code || "",
      acc_name: (account as any)?.acc_name || detail.acc_name || "",
      cost_id: costId, // قد يكون null أو رقم
      debit: parseFloat(detail.debit) || 0,
      credit: parseFloat(detail.credit) || 0,
      debit_base: detail.debit_base !== undefined ? parseFloat(String(detail.debit_base)) : (parseFloat(detail.debit) || 0),
      credit_base: detail.credit_base !== undefined ? parseFloat(String(detail.credit_base)) : (parseFloat(detail.credit) || 0),
      g_debit: detail.g_debit !== undefined ? parseFloat(String(detail.g_debit)) : (parseFloat(detail.debit_g) || 0),
      g_credit: detail.g_credit !== undefined ? parseFloat(String(detail.g_credit)) : (parseFloat(detail.credit_g) || 0),
      g_debit_base: detail.g_debit_base !== undefined ? parseFloat(String(detail.g_debit_base)) : 0,
      g_credit_base: detail.g_credit_base !== undefined ? parseFloat(String(detail.g_credit_base)) : 0,
      gauge: parseFloat(detail.gauge) || 875,
      vouch_notes: detail.vouch_notes || "",
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

    const processedBox: VoucherBox = {
      id: boxData.id || 0,
      vouch_id: boxData.vouch || boxData.vouch_id || targetVoucher.id || 0,
      box_id: boxId,
      box: boxObject, // معلومات الصندوق الكاملة إذا كانت موجودة
      amount: parseFloat(String(boxData.vouch_amt || boxData.amount || 0)),
      vouch_notes:
        boxData.box_note || boxData.vouch_notes || boxData.notes || "",
      cost_id: costId,
      inv_id: invId,
      cr_date: boxData.cr_date || new Date().toISOString(),
    };

    return processedBox;
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
    commit: targetVoucher.commit || false,
    post: targetVoucher.post || false,
    print: targetVoucher.print || false,
  };

  return (
    <div className="container mx-auto p-4">
      <Breadcrumb
        items={[
          { name: "سند صرف", href: "/forms/voucher2" },
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
        vouchType={2}
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
