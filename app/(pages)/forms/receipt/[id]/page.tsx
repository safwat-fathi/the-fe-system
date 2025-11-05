import { notFound } from "next/navigation";
import { Metadata } from "next";

import ReceiptVoucherClientPage from "../ReceiptVoucherClientPage";

import voucherFormDataService from "@/services/bff/voucher-form-data.service";
import { voucherService } from "@/services/api";
import { Voucher, VoucherBox, GVoucherDetail } from "@/types/voucher";
import Breadcrumb from "@/components/Breadcrumb";

export const metadata: Metadata = {
  title: "عرض سند استلام - NafeesWeb",
  description: "عرض وتعديل سند الاستلام",
};

const getVoucherById = async (voucherId: number) => {
  try {
    if (!voucherId || isNaN(voucherId)) {
      return null;
    }

    // محاولة البحث أولاً مع xvouch_type محددة
    let voucher = await voucherService.getVoucherById(voucherId, {
      xvouch_type: "111", // سند الاستلام فقط
    });

    // إذا لم يتم العثور عليه، محاولة البحث بدون تحديد نوع السند (لأن السند الجديد قد لا يكون مفهرساً بعد)
    if (!voucher) {
      voucher = await voucherService.getVoucherById(voucherId, {
        xvouch_type: "0", // البحث في جميع الأنواع
      });
    }

    // التحقق من أن السند من نوع 111 (سند الاستلام)
    if (voucher && voucher.vouch_type === 111) {
      return voucher;
    }
    return null;
  } catch (error) {
    console.error("Error fetching voucher:", error);

    return null;
  }
};

const getGoldDetails = async (voucherId: number, branchId?: number | string) => {
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
};

const getVoucherBoxes = async (voucherId: number, branchId?: number | string) => {
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
};

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

  const formMode = mode === "edit" ? "edit" : "preview";
  const startInEditMode = mode === "edit";

  const voucherId = parseInt(id);

  if (isNaN(voucherId) || voucherId <= 0) {
    notFound();
  }

  let targetVoucher = await getVoucherById(voucherId);
  
  // إذا لم يتم العثور على السند، إعادة المحاولة
  if (!targetVoucher) {
    // محاولة البحث بدون تحديد نوع السند
    targetVoucher = await voucherService.getVoucherById(voucherId, {
      xvouch_type: "0", // البحث في جميع الأنواع
    });
    
    // إذا لم يتم العثور عليه، محاولة البحث في جميع السندات
    if (!targetVoucher || targetVoucher.vouch_type !== 111) {
      const allVouchersResponse = await voucherService.getAll({
        xvouch_type: "111",
        page: "1",
      });
      
      if (allVouchersResponse.success && allVouchersResponse.data) {
        const vouchers = Array.isArray(allVouchersResponse.data)
          ? allVouchersResponse.data
          : [];
        
        const foundVoucher = vouchers.find(
          (v: any) => {
            const matchesId = v.id && Number(v.id) === voucherId;
            const matchesVouchId = v.vouch_id && Number(v.vouch_id) === voucherId;
            return matchesId || matchesVouchId;
          }
        );
        
        if (foundVoucher && foundVoucher.vouch_type === 111) {
          targetVoucher = foundVoucher;
        }
      }
    }
    
    if (!targetVoucher || targetVoucher.vouch_type !== 111) {
      notFound();
    }
  }

  const formData = await voucherFormDataService.getVoucherFormData();

  const branchId = Number(targetVoucher.com_id ?? targetVoucher.com ?? 1) || 1;
  const voucherIdForDetails = targetVoucher.id || voucherId;
  
  const [goldDetailsData, boxesData] = await Promise.all([
    getGoldDetails(voucherIdForDetails, branchId),
    getVoucherBoxes(voucherIdForDetails, branchId),
  ]);

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
      vouch_id: targetVoucher?.vouch_id || 0,
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

  const boxes: VoucherBox[] = boxesData.map((boxData: any) => {
    let boxId = 0;
    let boxObject: VoucherBox["box"] = undefined;

    if (boxData.hasOwnProperty("box")) {
      if (boxData.box !== null && boxData.box !== undefined) {
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
          boxId = Number(boxData.box);
        }
      }
    }

    if (boxId === 0 && boxData.hasOwnProperty("box_id")) {
      if (
        boxData.box_id !== null &&
        boxData.box_id !== undefined &&
        boxData.box_id !== ""
      ) {
        boxId = Number(boxData.box_id);
      }
    }

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
      vouch_id: boxData.vouch || boxData.vouch_id || targetVoucher?.id || 0,
      box_id: boxId,
      box: boxObject,
      amount: parseFloat(String(boxData.vouch_amt || boxData.amount || 0)),
      vouch_notes:
        boxData.box_note || boxData.vouch_notes || boxData.notes || "",
      cost_id: costId,
      inv_id: invId,
      close_weight: parseFloat(String(boxData.close_weight || 0)) || undefined,
      cr_date: boxData.cr_date || new Date().toISOString(),
    };
  });

  const formattedVoucher: Voucher = {
    ...targetVoucher,
    vouch_date: targetVoucher?.vouch_date || new Date().toISOString(),
    cr_date: targetVoucher?.cr_date || new Date().toISOString(),
    vouch_id: targetVoucher?.vouch_id || 0,
    ref_no: targetVoucher?.ref_no || "",
    vouch_notes: targetVoucher?.vouch_notes || "",
    vouch_status: targetVoucher?.vouch_status || 1,
    pay_type: targetVoucher?.pay_type || 1,
    commit: targetVoucher?.commit || false,
    post: targetVoucher?.post || false,
    handling: (targetVoucher as any)?.handling || "",
    print: targetVoucher?.print || false,
    // معالجة cust - قد يكون cust أو cust_id في API
    cust_id:
      targetVoucher?.cust_id ||
      (targetVoucher as any)?.cust ||
      undefined,
  };

  return (
    <div className="container mx-auto p-4">
      <Breadcrumb
        items={[
          { name: "سند استلام", href: "/forms/receipt" },
          {
            name:
              formMode === "edit"
                ? `تعديل ${targetVoucher?.vouch_id || targetVoucher?.id || ""}`
                : "معاينة",
          },
        ]}
      />
      <ReceiptVoucherClientPage
        accounts={formData.accounts}
        boxes={formData.boxes || []}
        costCenters={formData.costCenters}
        customers={formData.customers || []}
        formMode={formMode}
        goldDetailsData={goldDetails}
        isNewVoucher={false}
        items={formData.items || []}
        startInEditMode={startInEditMode}
        vouchType={111}
        voucherBoxes={boxes}
        voucherData={formattedVoucher}
        voucherRecordId={targetVoucher?.id || voucherId}
        voucherTypes={formData.voucherTypes}
      />
    </div>
  );
}
