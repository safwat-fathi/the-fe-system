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
import { processVoucherBoxes } from "./helpers/process-boxes";
import { processVoucherDetails } from "./helpers/process-details";
import { processGoldDetails } from "./helpers/process-gold-details";
import { revalidateVoucherPaths } from "./helpers/revalidation";
import { postVoucherToGL } from "./helpers/post-to-gl";

import { voucherService } from "@/services/api";
import { requiresBoxes } from "@/utilities/voucher/routing";

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
    const normalizeCostValue = (...values: unknown[]): number | null => {
      for (const value of values) {
        if (value === undefined || value === null) {
          continue;
        }

        const numeric = Number(value);

        if (Number.isFinite(numeric) && numeric > 0) {
          return numeric;
        }
      }

      return null;
    };

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
      commit: true, // ✅ عند الحفظ، commit: true
      handling:
        voucherData.handling !== undefined && voucherData.handling !== null
          ? voucherData.handling
          : "",
    };

    const resolvedCost = normalizeCostValue(
      voucherData.cost_id,
      (voucherData as any).cost,
      voucherPayload.cost_id,
      (voucherPayload as any).cost,
    );

    if (resolvedCost !== null) {
      voucherPayload.cost_id = resolvedCost;
      (voucherPayload as any).cost = resolvedCost;
    } else {
      voucherPayload.cost_id = null;
      (voucherPayload as any).cost = null;
    }

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
    }

    let voucherResponse = await voucherService.create(voucherPayload);

    if (!voucherResponse.success || !voucherResponse.data) {
      const duplicateResolution = await handleDuplicateVoucherNumber(
        voucherResponse,
        voucherData,
        voucherPayload,
      );

      if (!duplicateResolution.success) {
        return duplicateResolution.result;
      }

      voucherResponse = duplicateResolution.voucherResponse;
      voucherData = duplicateResolution.voucherData;
      // Note: voucherPayload is updated in retry logic (line 306) if needed
    }

    const savedVoucher = voucherResponse.data;
    let masterId = (savedVoucher as any)?.id;
    const savedVouchId =
      (savedVoucher as any)?.vouch_id || voucherData.vouch_id;

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

    if (requiresBoxes(voucherData.vouch_type)) {
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
    }

    // حفظ التفاصيل
    const detailsResult = await processVoucherDetails(
      masterId,
      details,
      currentDate,
      currentUsername,
      voucherData.vouch_type,
    );

    if (!detailsResult.success) {
      return {
        success: false,
        message: detailsResult.error || "خطأ في حفظ التفاصيل",
      };
    }

    // ترحيل القيد للـ GL يدوياً بعد حفظ التفاصيل
    // console.log("[createVoucherAction] Posting voucher to GL manually...");
    try {
      const glPostResult = await postVoucherToGL({
        voucher_id: Number(masterId), // id من جدول vouchers (primary key)
        vouch_id: Number(savedVouchId), // رقم القيد (للرجوع إليه)
        vouch_type: voucherData.vouch_type,
        vouch_date: voucherData.vouch_date,
        ref_no: voucherData.ref_no || "",
        vouch_notes: voucherData.vouch_notes || "",
        details: details.map((d) => ({
          acc_id: d.acc_id || 0,
          debit: d.debit || d.debit_base || 0,
          credit: d.credit || d.credit_base || 0,
          debit_base: d.debit_base || d.debit || 0,
          credit_base: d.credit_base || d.credit || 0,
          g_debit: d.g_debit || d.g_debit_base || 0,
          g_credit: d.g_credit || d.g_credit_base || 0,
          g_debit_base: d.g_debit_base || d.g_debit || 0,
          g_credit_base: d.g_credit_base || d.g_credit || 0,
          cost_id: d.cost_id || null,
          vouch_notes: d.vouch_notes || "",
        })),
        voucherBoxes: voucherBoxes, // إضافة الصناديق للترحيل
        com: 1,
        year: 1,
        cust_id: voucherData.cust_id || null,
      });

      if (glPostResult.success) {
        // console.log(`[createVoucherAction] ✅ Successfully posted ${glPostResult.createdCount} GL transactions`);
      } else {
        // console.warn(`[createVoucherAction] ⚠️ Failed to post to GL: ${glPostResult.error}`);
        // لا نفشل العملية، فقط نسجل التحذير
      }
    } catch (glPostError) {
      console.error("[createVoucherAction] Error posting to GL:", glPostError);
      // لا نفشل العملية، فقط نسجل الخطأ
    }

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

    /* console.log("=== [createVoucherAction] SUCCESS ===");
    console.log("Master ID:", masterId);
    console.log("Vouch ID:", savedVouchId); */

    return {
      success: true,
      data: {
        id: masterId,
        vouch_id: savedVouchId,
      },
      message: "تم حفظ القيد بنجاح",
    };
  } catch (error) {
    console.error("=== [createVoucherAction] ERROR ===");
    console.error("Error:", error);

    return {
      success: false,
      message: error instanceof Error ? error.message : "حدث خطأ",
    };
  }
}

const DUPLICATE_ERROR_SNIPPET =
  "The fields com, vouch_type, vouch_id must make a unique set.";

type DuplicateResolution =
  | {
      success: true;
      voucherResponse: Awaited<ReturnType<typeof voucherService.create>>;
      voucherPayload: any;
      voucherData: SaveVoucherData;
    }
  | {
      success: false;
      result: {
        success: false;
        message: string;
      };
    };

async function handleDuplicateVoucherNumber(
  response: Awaited<ReturnType<typeof voucherService.create>>,
  voucherData: SaveVoucherData,
  voucherPayload: any,
): Promise<DuplicateResolution> {
  const responseData = response?.data as {
    non_field_errors?: string[];
  } | null;
  const nonFieldErrors: string[] | undefined = Array.isArray(
    responseData?.non_field_errors,
  )
    ? responseData?.non_field_errors
    : undefined;

  const hasDuplicateError = nonFieldErrors?.some((err) =>
    String(err).includes(DUPLICATE_ERROR_SNIPPET),
  );

  if (!hasDuplicateError) {
    return {
      success: false,
      result: {
        success: false,
        message:
          response.message ||
          "خطأ في حفظ القيد. يرجى المحاولة مرة أخرى أو التواصل مع المسؤول.",
      },
    };
  }

  const voucherType =
    voucherData.vouch_type ?? Number(voucherPayload?.vouch_type);

  if (!voucherType) {
    return {
      success: false,
      result: {
        success: false,
        message:
          "هناك سند بنفس الرقم، وتعذر تحديد نوع السند لتحديث الرقم تلقائياً.",
      },
    };
  }

  const currentNumber =
    Number(voucherData.vouch_id ?? voucherPayload?.vouch_id) || 0;

  let nextNumber = await voucherService.getNextNumber(voucherType);

  if (!Number.isFinite(nextNumber) || nextNumber <= currentNumber) {
    nextNumber = currentNumber + 1;
  }

  const updatedVoucherPayload = {
    ...voucherPayload,
    vouch_id: nextNumber,
  };

  voucherData = {
    ...voucherData,
    vouch_id: nextNumber,
  };

  const retryResponse = await voucherService.create(updatedVoucherPayload);

  if (!retryResponse.success || !retryResponse.data) {
    return {
      success: false,
      result: {
        success: false,
        message:
          retryResponse.message ||
          "تعذر حفظ القيد حتى بعد تحديث الرقم. يرجى إعادة المحاولة.",
      },
    };
  }

  return {
    success: true,
    voucherResponse: retryResponse,
    voucherPayload,
    voucherData,
  };
}
