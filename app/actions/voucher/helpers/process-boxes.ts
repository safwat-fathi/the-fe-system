/**
 * Helper functions to process voucher boxes
 */

"use server";

import type { VoucherBoxData } from "./types";

import { voucherService } from "@/services/api";
import { requiresBoxes } from "@/utilities/voucher/routing";

/**
 * Process voucher boxes (create/update)
 */
export async function processVoucherBoxes(
  masterId: number,
  voucherBoxes: VoucherBoxData[],
  vouchType: number,
  currentDate: string,
  currentUsername: string | null,
): Promise<{ success: boolean; error?: string }> {
  if (!requiresBoxes(vouchType) || !voucherBoxes || voucherBoxes.length === 0) {
    return { success: true };
  }

  for (const box of voucherBoxes) {
    if (!box.box_id || box.box_id === 0 || !box.amount || box.amount === 0) {
      continue;
    }

    const boxData: any = {
      vouch: masterId,
      box: box.box_id,
      vouch_amt: box.amount.toString(),
      vouch_base_amt: box.amount.toString(),
      box_note: box.vouch_notes || "",
      com: 1,
      cur: 1,
      change: "1.00000",
      vouch_status: 1,
      close_weight: box.close_weight || null,
      cr_date: currentDate,
      cr_user: currentUsername || null,
    };

    if (box.cost_id !== undefined && box.cost_id !== null && box.cost_id > 0) {
      boxData.cost = box.cost_id;
    }
    if (box.inv_id !== undefined && box.inv_id !== null && box.inv_id > 0) {
      boxData.inv = box.inv_id;
    }

    const boxResponse = await voucherService.createBox(boxData);

    if (!boxResponse.success) {
      return {
        success: false,
        error: `فشل حفظ الصندوق: ${boxResponse.message}`,
      };
    }
  }

  return { success: true };
}

/**
 * Update voucher boxes (delete old, create/update new)
 */
export async function updateVoucherBoxes(
  realVoucherId: number,
  voucherBoxes: VoucherBoxData[],
  deletedBoxIds: number[],
  vouchType: number,
  currentDate: string,
  currentUsername: string | null,
): Promise<{ success: boolean; error?: string }> {
  // حذف الصناديق المحذوفة
  if (deletedBoxIds.length > 0) {
    for (const boxId of deletedBoxIds) {
      if (boxId && boxId > 0) {
        await voucherService.deleteBox(boxId);
      }
    }
  }

  if (!requiresBoxes(vouchType) || !voucherBoxes || voucherBoxes.length === 0) {
    return { success: true };
  }

  // جلب الصناديق الحالية
  const existingBoxesResponse = await voucherService.getBoxes(realVoucherId);
  const existingBoxIds =
    existingBoxesResponse.success && existingBoxesResponse.data
      ? (existingBoxesResponse.data as any[])
          .map((b: any) => b.id)
          .filter((id: any) => id && id > 0)
      : [];

  const newBoxIds = voucherBoxes
    .filter((b) => b.id && b.id > 0)
    .map((b) => b.id!);

  const boxIdsToDelete = existingBoxIds.filter(
    (id: number) => !newBoxIds.includes(id),
  );

  // حذف الصناديق المحذوفة
  for (const boxId of boxIdsToDelete) {
    if (boxId && boxId > 0) {
      await voucherService.deleteBox(boxId);
    }
  }

  // حفظ/تحديث الصناديق
  for (const box of voucherBoxes) {
    if (!box.box_id || box.box_id === 0 || !box.amount || box.amount === 0) {
      continue;
    }

    const boxData: any = {
      vouch: realVoucherId,
      box: box.box_id,
      vouch_amt: box.amount.toString(),
      vouch_base_amt: box.amount.toString(),
      box_note: box.vouch_notes || "",
      com: 1,
      cur: 1,
      change: "1.00000",
      vouch_status: 1,
      close_weight: box.close_weight || null,
    };

    if (box.id && box.id > 0) {
      boxData.upd_date = currentDate;
      boxData.upd_user = currentUsername || null;
    } else {
      boxData.cr_date = currentDate;
      boxData.cr_user = currentUsername || null;
    }

    if (box.cost_id !== undefined && box.cost_id !== null && box.cost_id > 0) {
      boxData.cost = box.cost_id;
    }
    if (box.inv_id !== undefined && box.inv_id !== null && box.inv_id > 0) {
      boxData.inv = box.inv_id;
    }

    const boxResponse =
      box.id && box.id > 0
        ? await voucherService.updateBox(box.id, boxData)
        : await voucherService.createBox(boxData);

    if (!boxResponse.success) {
      return {
        success: false,
        error: `فشل حفظ الصندوق: ${boxResponse.message}`,
      };
    }
  }

  return { success: true };
}
