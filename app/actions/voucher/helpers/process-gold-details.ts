/**
 * Helper functions to process gold voucher details
 */

"use server";

import type { GVoucherDetailData } from "./types";

import { voucherService } from "@/services/api";
import { requiresGoldDetails } from "@/utilities/voucher/routing";

/**
 * Process gold voucher details (create)
 */
export async function processGoldDetails(
  masterId: number,
  goldDetails: GVoucherDetailData[],
  vouchType: number,
  currentDate: string,
  currentUsername: string | null,
): Promise<{ success: boolean; error?: string }> {
  if (
    !requiresGoldDetails(vouchType) ||
    !goldDetails ||
    goldDetails.length === 0
  ) {
    return { success: true };
  }

  for (const goldDetail of goldDetails) {
    if (!goldDetail.item_id || goldDetail.item_id === 0) {
      continue;
    }

    const goldDetailData: any = {
      vouch: masterId,
      item: goldDetail.item_id,
      com: 1,
      vouch_type: vouchType,
      vouch_status: 1,
      cr_date: currentDate,
      cr_user: currentUsername || null,
    };

    // إضافة الحقول الاختيارية
    if (goldDetail.k !== undefined && goldDetail.k !== null) {
      goldDetailData.k = goldDetail.k.toString();
    }
    if (goldDetail.weight !== undefined && goldDetail.weight !== null) {
      goldDetailData.weight = goldDetail.weight.toString();
    }
    if (goldDetail.g_weight !== undefined && goldDetail.g_weight !== null) {
      goldDetailData.g_weight = goldDetail.g_weight.toString();
    }
    if (goldDetail.weight2 !== undefined && goldDetail.weight2 !== null) {
      goldDetailData.weight2 = goldDetail.weight2.toString();
    }
    if (goldDetail.g_weight2 !== undefined && goldDetail.g_weight2 !== null) {
      goldDetailData.g_weight2 = goldDetail.g_weight2.toString();
    }
    if (goldDetail.box_id && goldDetail.box_id > 0) {
      goldDetailData.box = goldDetail.box_id;
    }
    if (goldDetail.notes) {
      goldDetailData.notes = goldDetail.notes;
    }
    if (goldDetail.diff !== undefined && goldDetail.diff !== null) {
      goldDetailData.diff = goldDetail.diff.toString();
    }
    if (goldDetail.close_amt !== undefined && goldDetail.close_amt !== null) {
      goldDetailData.close_amt = goldDetail.close_amt.toString();
    }
    if (
      goldDetail.close_weight !== undefined &&
      goldDetail.close_weight !== null
    ) {
      goldDetailData.close_weight = goldDetail.close_weight.toString();
    }
    if (goldDetail.inv_id && goldDetail.inv_id > 0) {
      goldDetailData.inv = goldDetail.inv_id;
    }
    if (goldDetail.cost_id && goldDetail.cost_id > 0) {
      goldDetailData.cost = goldDetail.cost_id;
    }
    if (goldDetail.work_amt !== undefined && goldDetail.work_amt !== null) {
      goldDetailData.work_amt = goldDetail.work_amt.toString();
    }
    if (goldDetail.total_work !== undefined && goldDetail.total_work !== null) {
      goldDetailData.total_work = goldDetail.total_work.toString();
    }
    if (goldDetail.qty !== undefined && goldDetail.qty !== null) {
      goldDetailData.qty = goldDetail.qty.toString();
    }

    const goldDetailResponse =
      await voucherService.createGoldDetail(goldDetailData);

    if (!goldDetailResponse.success) {
      return {
        success: false,
        error: `فشل حفظ تفصيل الذهب: ${goldDetailResponse.message}`,
      };
    }
  }

  return { success: true };
}

/**
 * Update gold voucher details
 * Handles create, update, and delete operations for gold details
 */
export async function updateGoldDetails(
  realVoucherId: number,
  goldDetails: GVoucherDetailData[],
  vouchType: number,
  currentDate: string,
  currentUsername: string | null,
  deletedGoldDetailIds: number[] = [],
): Promise<{ success: boolean; error?: string }> {
  if (!requiresGoldDetails(vouchType)) {
    return { success: true };
  }

  // حذف السجلات المحذوفة
  if (deletedGoldDetailIds && deletedGoldDetailIds.length > 0) {
    console.log(
      `[SERVER] 🗑️ حذف ${deletedGoldDetailIds.length} تفصيل ذهب`,
      `vouch_id: ${realVoucherId}`,
    );

    for (const detailId of deletedGoldDetailIds) {
      if (!detailId || detailId <= 0) {
        continue;
      }

      try {
        const deleteResponse = await voucherService.deleteGoldDetail(detailId, {
          com: 1,
        });

        if (!deleteResponse.success) {
          console.error(
            `[SERVER] ❌ فشل حذف تفصيل الذهب ${detailId}:`,
            deleteResponse.message || "خطأ غير معروف",
          );
          // لا نوقف العملية، نكمل مع البقية
        } else {
          console.log(
            `[SERVER] ✅ تم حذف تفصيل الذهب ${detailId} بنجاح`,
          );
        }
      } catch (error) {
        console.error(
          `[SERVER] ❌ خطأ في حذف تفصيل الذهب ${detailId}:`,
          error instanceof Error ? error.message : String(error),
        );
        // لا نوقف العملية، نكمل مع البقية
      }
    }
  }

  // معالجة التفاصيل (إنشاء أو تحديث)
  if (!goldDetails || goldDetails.length === 0) {
    return { success: true };
  }

  for (const goldDetail of goldDetails) {
    if (!goldDetail.item_id || goldDetail.item_id === 0) {
      continue;
    }

    const goldDetailData: any = {
      vouch: realVoucherId,
      item: goldDetail.item_id,
      com: 1,
      vouch_type: vouchType,
      vouch_status: 1,
    };

    // إضافة الحقول الاختيارية
    if (goldDetail.k !== undefined && goldDetail.k !== null) {
      goldDetailData.k = goldDetail.k.toString();
    }
    if (goldDetail.weight !== undefined && goldDetail.weight !== null) {
      goldDetailData.weight = goldDetail.weight.toString();
    }
    if (goldDetail.g_weight !== undefined && goldDetail.g_weight !== null) {
      goldDetailData.g_weight = goldDetail.g_weight.toString();
    }
    if (goldDetail.weight2 !== undefined && goldDetail.weight2 !== null) {
      goldDetailData.weight2 = goldDetail.weight2.toString();
    }
    if (goldDetail.g_weight2 !== undefined && goldDetail.g_weight2 !== null) {
      goldDetailData.g_weight2 = goldDetail.g_weight2.toString();
    }
    if (goldDetail.box_id && goldDetail.box_id > 0) {
      goldDetailData.box = goldDetail.box_id;
    }
    if (goldDetail.notes) {
      goldDetailData.notes = goldDetail.notes;
    }
    if (goldDetail.diff !== undefined && goldDetail.diff !== null) {
      goldDetailData.diff = goldDetail.diff.toString();
    }
    if (goldDetail.close_amt !== undefined && goldDetail.close_amt !== null) {
      goldDetailData.close_amt = goldDetail.close_amt.toString();
    }
    if (
      goldDetail.close_weight !== undefined &&
      goldDetail.close_weight !== null
    ) {
      goldDetailData.close_weight = goldDetail.close_weight.toString();
    }
    if (goldDetail.inv_id && goldDetail.inv_id > 0) {
      goldDetailData.inv = goldDetail.inv_id;
    }
    if (goldDetail.cost_id && goldDetail.cost_id > 0) {
      goldDetailData.cost = goldDetail.cost_id;
    }
    if (goldDetail.work_amt !== undefined && goldDetail.work_amt !== null) {
      goldDetailData.work_amt = goldDetail.work_amt.toString();
    }
    if (goldDetail.total_work !== undefined && goldDetail.total_work !== null) {
      goldDetailData.total_work = goldDetail.total_work.toString();
    }
    if (goldDetail.qty !== undefined && goldDetail.qty !== null) {
      goldDetailData.qty = goldDetail.qty.toString();
    }

    // إذا كان السجل موجوداً (له id)، قم بتحديثه
    if (goldDetail.id && goldDetail.id > 0) {
      console.log(
        `[SERVER] 📝 تحديث تفصيل ذهب موجود ${goldDetail.id}`,
      );

      const updateResponse = await voucherService.updateGoldDetail(
        goldDetail.id,
        goldDetailData,
      );

      if (!updateResponse.success) {
        return {
          success: false,
          error: `فشل تحديث تفصيل الذهب ${goldDetail.id}: ${updateResponse.message}`,
        };
      }
    } else {
      // سجل جديد، قم بإنشائه
      console.log(
        `[SERVER] ➕ إنشاء تفصيل ذهب جديد`,
        `item_id: ${goldDetail.item_id}`,
      );

      goldDetailData.cr_date = currentDate;
      goldDetailData.cr_user = currentUsername || null;

      const createResponse =
        await voucherService.createGoldDetail(goldDetailData);

      if (!createResponse.success) {
        return {
          success: false,
          error: `فشل حفظ تفصيل الذهب: ${createResponse.message}`,
        };
      }
    }
  }

  return { success: true };
}
