/**
 * Create voucher action
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
import { createGLTransactionRecords } from "./helpers/gl-transaction";
import { processVoucherBoxes } from "./helpers/process-boxes";
import { processVoucherDetails } from "./helpers/process-details";
import { processGoldDetails } from "./helpers/process-gold-details";
import { revalidateVoucherPaths } from "./helpers/revalidation";

import { voucherService } from "@/services/api";

/**
 * Create a new voucher
 */
export async function createVoucherAction(
  voucherData: SaveVoucherData,
  details: VoucherDetailData[] = [],
  voucherBoxes: VoucherBoxData[] = [],
  goldDetails: GVoucherDetailData[] = [],
) {
  try {
    // التحقق من البيانات - تمرير goldDetails للتحقق في سندات الذهب
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

    // تجهيز بيانات القيد
    const voucherPayload: any = {
      ...voucherData,
      com: 1,
      year: 1,
      cr_date: currentDate,
      cr_user: currentUsername || null,
      vouch_amt: 0,
      vouch_status: voucherData.vouch_status || 1,
      opps_vouch: voucherData.opps_vouch || 0,
      commit: true,
    };

    // إضافة cust للسندات الذهبية
    if ([4, 5, 111, 222].includes(voucherData.vouch_type)) {
      const custValue =
        voucherData.cust_id !== undefined &&
        voucherData.cust_id !== null &&
        voucherData.cust_id > 0
          ? voucherData.cust_id
          : voucherPayload.cust !== undefined &&
              voucherPayload.cust !== null &&
              voucherPayload.cust > 0
            ? voucherPayload.cust
            : null;

      if (custValue && custValue > 0) {
        voucherPayload.cust = custValue;
      }
      delete voucherPayload.cust_id;
    }

    // حفظ السند الرئيسي
    const voucherResponse = await voucherService.create(voucherPayload);

    if (!voucherResponse.success || !voucherResponse.data) {
      return {
        success: false,
        message: voucherResponse.message || "خطأ في حفظ القيد",
      };
    }

    const savedVoucher = voucherResponse.data;
    let masterId = (savedVoucher as any)?.id;

    // Fallback: البحث عن القيد إذا لم يكن id موجوداً
    if (!masterId || masterId <= 0) {
      if (savedVoucher && (savedVoucher as any).vouch_id) {
        const lookupResponse = await voucherService.getVoucherById(
          (savedVoucher as any).vouch_id,
          {
            xvouch_type: voucherData.vouch_type?.toString() || "0",
          },
        );

        if (lookupResponse && (lookupResponse as any)?.id) {
          masterId = (lookupResponse as any).id;
        }
      }
    }

    if (!masterId || masterId <= 0) {
      console.error("[createVoucherAction] No ID found after all attempts");
      return {
        success: false,
        message: "لم يتم الحصول على رقم القيد من الخادم",
      };
    }

    // حفظ الصناديق
    const boxesResult = await processVoucherBoxes(
      masterId,
      voucherBoxes,
      voucherData.vouch_type,
      currentDate,
      currentUsername,
    );

    if (!boxesResult.success) {
      return {
        success: false,
        message: boxesResult.error || "خطأ في حفظ الصناديق",
      };
    }

    // حفظ التفاصيل
    const detailsResult = await processVoucherDetails(
      masterId,
      details,
      currentDate,
      currentUsername,
    );

    if (!detailsResult.success) {
      return {
        success: false,
        message: detailsResult.error || "خطأ في حفظ التفاصيل",
      };
    }

    // ترحيل سجلات gl_transaction
    await createGLTransactionRecords(
      voucherData,
      details,
      masterId,
      currentDate,
      currentUsername,
      voucherPayload,
      voucherBoxes,
      goldDetails,
    );

    // حفظ تفاصيل الذهب
    const goldResult = await processGoldDetails(
      masterId,
      goldDetails,
      voucherData.vouch_type,
      currentDate,
      currentUsername,
    );

    if (!goldResult.success) {
      return {
        success: false,
        message: goldResult.error || "خطأ في حفظ تفاصيل الذهب",
      };
    }

    // Revalidate paths
    revalidateVoucherPaths(voucherData.vouch_type, masterId);

    const savedVouchId = (savedVoucher as any).vouch_id || voucherData.vouch_id;

    return {
      success: true,
      data: {
        id: masterId,
        vouch_id: savedVouchId,
      },
      message: "تم حفظ القيد بنجاح",
    };
  } catch (error) {
    return {
      success: false,
      message: error instanceof Error ? error.message : "حدث خطأ",
    };
  }
}
