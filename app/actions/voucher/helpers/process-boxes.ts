/**
 * Helper functions to process voucher boxes
 */

"use server";

import type { VoucherBoxData } from "./types";

import { voucherService } from "@/services/api";
import { requiresBoxes } from "@/utilities/voucher/routing";

const formatParallelErrors = (
  context: string,
  messages: string[],
): string => {
  if (messages.length === 0) return context;
  const uniqueMessages = Array.from(
    new Set(
      messages.map((message) =>
        typeof message === "string" && message.trim().length > 0
          ? message.trim()
          : "خطأ غير معروف",
      ),
    ),
  );
  const preview = uniqueMessages.slice(0, 3).join(" | ");
  const extra =
    uniqueMessages.length > 3
      ? ` (+${uniqueMessages.length - 3} أخطاء إضافية)`
      : "";

  return `${context}: ${preview}${extra}`;
};

const collectSettledErrors = (
  results: PromiseSettledResult<unknown>[],
): string[] =>
  results
    .filter(
      (result): result is PromiseRejectedResult => result.status === "rejected",
    )
    .map((result) => {
      const reason = result.reason;

      if (reason instanceof Error) return reason.message;
      if (typeof reason === "string") return reason;

      try {
        return JSON.stringify(reason);
      } catch {
        return "خطأ غير معروف";
      }
    });

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

  const createOperations = voucherBoxes
    .filter((box) => box.box_id && box.box_id > 0 && box.amount && box.amount !== 0)
    .map((box) => {
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

      return voucherService.createBox(boxData).then((response) => {
        if (!response.success) {
          throw new Error(
            response.message ||
              `فشل حفظ الصندوق للحساب ${box.box_id.toString()}`,
          );
        }

        return response;
      });
    });

  if (createOperations.length === 0) {
    return { success: true };
  }

  const createResults = await Promise.allSettled(createOperations);
  const creationErrors = collectSettledErrors(createResults);

  if (creationErrors.length > 0) {
    return {
      success: false,
      error: formatParallelErrors("أخطاء حفظ الصناديق", creationErrors),
    };
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
    const deleteResults = await Promise.allSettled(
      deletedBoxIds
        .filter((boxId) => boxId && boxId > 0)
        .map((boxId) =>
          voucherService.deleteBox(boxId).then((response) => {
            if (!response.success) {
              throw new Error(
                response.message ||
                  `فشل حذف الصندوق رقم ${boxId.toString()}`,
              );
            }

            return response;
          }),
        ),
    );

    const deleteErrors = collectSettledErrors(deleteResults);

    if (deleteErrors.length > 0) {
      return {
        success: false,
        error: formatParallelErrors("أخطاء حذف الصناديق", deleteErrors),
      };
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
  if (boxIdsToDelete.length > 0) {
    const deleteResults = await Promise.allSettled(
      boxIdsToDelete
        .filter((boxId) => boxId && boxId > 0)
        .map((boxId) =>
          voucherService.deleteBox(boxId).then((response) => {
            if (!response.success) {
              throw new Error(
                response.message ||
                  `فشل حذف الصندوق رقم ${boxId.toString()}`,
              );
            }

            return response;
          }),
        ),
    );

    const deleteErrors = collectSettledErrors(deleteResults);

    if (deleteErrors.length > 0) {
      return {
        success: false,
        error: formatParallelErrors("أخطاء حذف الصناديق", deleteErrors),
      };
    }
  }

  // حفظ/تحديث الصناديق
  const boxOperations = voucherBoxes
    .filter((box) => box.box_id && box.box_id > 0 && box.amount && box.amount !== 0)
    .map((box) => {
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

      const request = box.id && box.id > 0
        ? voucherService.updateBox(box.id, boxData)
        : voucherService.createBox(boxData);

      return request.then((response) => {
        if (!response.success) {
          throw new Error(
            response.message ||
              `فشل حفظ الصندوق للحساب ${box.box_id.toString()}`,
          );
        }

        return response;
      });
    });

  if (boxOperations.length === 0) {
    return { success: true };
  }

  const boxResults = await Promise.allSettled(boxOperations);
  const operationErrors = collectSettledErrors(boxResults);

  if (operationErrors.length > 0) {
    return {
      success: false,
      error: formatParallelErrors("أخطاء حفظ/تحديث الصناديق", operationErrors),
    };
  }

  return { success: true };
}
