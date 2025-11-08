/**
 * Update voucher action
 */

"use server";

import type {
  SaveVoucherData,
  VoucherDetailData,
  VoucherBoxData,
  GVoucherDetailData,
} from "./helpers/types";

import { getCurrentUsername } from "./helpers/common";
import { validateVoucherData } from "./helpers/validation";
import {
  createGLTransactionRecords,
  deleteGLTransactionRecords,
} from "./helpers/gl-transaction";
import { updateVoucherBoxes } from "./helpers/process-boxes";
import { updateVoucherDetails } from "./helpers/process-details";
import { updateGoldDetails } from "./helpers/process-gold-details";
import { revalidateVoucherPaths } from "./helpers/revalidation";

import { voucherService } from "@/services/api";

/**
 * Update an existing voucher
 */
export async function updateVoucherAction(
  voucherData: SaveVoucherData,
  details: VoucherDetailData[],
  deletedDetailIds: number[] = [],
  voucherRecordId?: number,
  voucherBoxes: VoucherBoxData[] = [],
  deletedBoxIds: number[] = [],
  goldDetails: GVoucherDetailData[] = [],
  deletedGoldDetailIds: number[] = [],
) {
  try {
    // التحقق من صحة البيانات
    if (!voucherData.vouch_id || voucherData.vouch_id <= 0) {
      return {
        success: false,
        message: "معرف القيد غير صحيح",
      };
    }

    const validation = validateVoucherData(
      voucherData,
      details,
      voucherBoxes,
      goldDetails,
    );

    if (!validation.isValid) {
      return {
        success: false,
        message: validation.error || "خطأ في التحقق من البيانات",
      };
    }

    const currentUsername = await getCurrentUsername();
    const currentDate = new Date().toISOString();

    let realVoucherId: number;
    let voucherRecord: any = null;

    // البحث عن ID الحقيقي
    if (voucherRecordId && voucherRecordId > 0) {
      realVoucherId = voucherRecordId;
      const vouchersResponse = await voucherService.getAll({
        xvouch_type: voucherData.vouch_type?.toString() || "0",
      });

      voucherRecord = vouchersResponse.data?.find(
        (v: any) =>
          v.id === realVoucherId &&
          v.vouch_type === (voucherData.vouch_type || 0),
      );
    } else {
      const vouchersResponse = await voucherService.getAll({
        xvouch_type: voucherData.vouch_type?.toString() || "0",
      });

      voucherRecord = vouchersResponse.data?.find(
        (v: any) =>
          v.vouch_id === voucherData.vouch_id &&
          v.vouch_type === (voucherData.vouch_type || 0),
      );

      if (!voucherRecord || !voucherRecord.id) {
        return {
          success: false,
          message: "لم يتم العثور على القيد في قاعدة البيانات",
        };
      }

      realVoucherId = voucherRecord.id;
    }

    // تجهيز بيانات القيد للتحديث
    const voucherPayload: any = {
      vouch_notes: voucherData.vouch_notes || "",
      vouch_date: voucherData.vouch_date,
      vouch_status: voucherData.vouch_status || 1,
      pay_type: voucherData.pay_type,
      ref_no: voucherData.ref_no || "",
      vouch_amt: 0,
      opps_vouch: voucherData.opps_vouch || 0,
      handling:
        voucherData.handling !== undefined && voucherData.handling !== null
          ? voucherData.handling
          : "",
      commit: true,
      upd_date: currentDate,
      upd_user: currentUsername || null,
    };

    // إضافة cust للسندات الذهبية
    if ([4, 5, 111, 222].includes(voucherData.vouch_type)) {
      const custValue =
        voucherData.cust_id !== undefined &&
        voucherData.cust_id !== null &&
        voucherData.cust_id > 0
          ? voucherData.cust_id
          : null;

      if (custValue && custValue > 0) {
        voucherPayload.cust = custValue;
      }
      // لا تحذف cust_id إذا كان موجوداً في voucherPayload، فقط أضف cust
      // delete voucherPayload.cust_id; // تم إزالة هذا السطر لأنه يحذف العميل

      // إضافة cost للسندات الذهبية (مطلوب دائماً)
      const costValue =
        voucherData.cost_id !== undefined &&
        voucherData.cost_id !== null &&
        voucherData.cost_id > 0
          ? voucherData.cost_id
          : null;

      // إرسال cost دائماً حتى لو كان null (لأن API يتطلبه)
      voucherPayload.cost = costValue;
    }

    if (![4, 5, 111, 222].includes(voucherData.vouch_type)) {
      voucherPayload.cost =
        voucherData.cost_id !== undefined && voucherData.cost_id !== null
          ? voucherData.cost_id
          : null;
    }

    // تحديث السند الرئيسي
    const voucherResponse = await voucherService.update(
      realVoucherId,
      voucherPayload,
    );

    if (!voucherResponse.success) {
      return {
        success: false,
        message: voucherResponse.message || "خطأ في تحديث القيد",
      };
    }

    // حذف سجلات gl_transaction القديمة
    await deleteGLTransactionRecords(
      voucherData.vouch_id,
      voucherData.vouch_type,
    );

    // تحديث الصناديق
    const boxesResult = await updateVoucherBoxes(
      realVoucherId,
      voucherBoxes,
      deletedBoxIds,
      voucherData.vouch_type,
      currentDate,
      currentUsername,
    );

    if (!boxesResult.success) {
      return {
        success: false,
        message: boxesResult.error || "خطأ في تحديث الصناديق",
      };
    }

    // تحديث التفاصيل
    const branchId = voucherRecord
      ? Number(voucherRecord.com_id ?? voucherRecord.com ?? 1) || 1
      : 1;
    const detailsResult = await updateVoucherDetails(
      realVoucherId,
      details,
      deletedDetailIds,
      currentDate,
      currentUsername,
      branchId,
    );

    if (!detailsResult.success) {
      return {
        success: false,
        message: detailsResult.error || "خطأ في تحديث التفاصيل",
      };
    }

    // ترحيل سجلات gl_transaction الجديدة
    await createGLTransactionRecords(
      voucherData,
      details,
      realVoucherId,
      currentDate,
      currentUsername,
      voucherPayload,
      voucherBoxes,
      goldDetails,
    );

    // تحديث تفاصيل الذهب
    const goldResult = await updateGoldDetails(
      realVoucherId,
      goldDetails,
      voucherData.vouch_type,
      currentDate,
      currentUsername,
      deletedGoldDetailIds,
    );

    if (!goldResult.success) {
      return {
        success: false,
        message: goldResult.error || "خطأ في تحديث تفاصيل الذهب",
      };
    }

    // Revalidate paths
    revalidateVoucherPaths(voucherData.vouch_type, realVoucherId);

    return {
      success: true,
      data: { vouch_id: voucherData.vouch_id, id: realVoucherId },
      message: "تم تحديث القيد بنجاح",
    };
  } catch (error) {
    return {
      success: false,
      message: error instanceof Error ? error.message : "حدث خطأ",
    };
  }
}
