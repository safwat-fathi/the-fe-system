/**
 * Helper functions to process voucher details
 */

"use server";

import type { VoucherDetailData } from "./types";

import { voucherService } from "@/services/api";

/**
 * Process voucher details (create)
 */
export async function processVoucherDetails(
  masterId: number,
  details: VoucherDetailData[],
  currentDate: string,
  currentUsername: string | null,
): Promise<{ success: boolean; error?: string }> {
  for (const detail of details) {
    if (!detail.acc_id || detail.acc_id === 0) {
      continue;
    }

    const detailData: any = {
      vouch: masterId,
      acc: detail.acc_id,
      debit: detail.debit || 0,
      credit: detail.credit || 0,
      base_debit: detail.base_debit || 0,
      base_credit: detail.base_credit || 0,
      gauge: detail.gauge || 875,
      debit_g: detail.debit_g || 0,
      credit_g: detail.credit_g || 0,
      vouch_notes: detail.vouch_notes || "",
      com: 1,
      year: 1,
      cr_date: currentDate,
      cr_user: currentUsername || null,
    };

    if (
      detail.cost_id !== undefined &&
      detail.cost_id !== null &&
      detail.cost_id > 0
    ) {
      detailData.cost = detail.cost_id;
    }

    const detailResponse = await voucherService.createDetail(detailData);

    if (!detailResponse.success) {
      return {
        success: false,
        error: `فشل حفظ التفصيل: ${detailResponse.message}`,
      };
    }
  }

  return { success: true };
}

/**
 * Update voucher details (delete old, create/update new)
 */
export async function updateVoucherDetails(
  realVoucherId: number,
  details: VoucherDetailData[],
  deletedDetailIds: number[],
  currentDate: string,
  currentUsername: string | null,
  branchId: number = 1,
): Promise<{ success: boolean; error?: string }> {
  // حذف التفاصيل المحذوفة صراحة
  if (deletedDetailIds.length > 0) {
    for (const detailId of deletedDetailIds) {
      if (detailId && detailId > 0) {
        await voucherService.deleteDetail(detailId);
      }
    }
  }

  // جلب التفاصيل الحالية
  const existingDetailsResponse = await voucherService.getDetails(
    realVoucherId,
    {
      xcom_id: branchId,
    },
  );
  const existingDetailIds =
    existingDetailsResponse.success && existingDetailsResponse.data
      ? existingDetailsResponse.data
          .map((d: any) => d.id)
          .filter((id: any) => id && id > 0)
      : [];

  const newDetailIds = details
    .filter((d) => d.id && d.id > 0)
    .map((d) => d.id!);

  const idsToDelete = existingDetailIds.filter(
    (id: number) => !newDetailIds.includes(id),
  );

  // حذف التفاصيل المحذوفة
  for (const detailId of idsToDelete) {
    if (detailId && detailId > 0) {
      await voucherService.deleteDetail(detailId);
    }
  }

  // حفظ/تحديث التفاصيل
  for (const detail of details) {
    if (!detail.acc_id || detail.acc_id === 0) {
      continue;
    }

    const detailData: any = {
      vouch: realVoucherId,
      acc: detail.acc_id,
      debit: detail.debit || 0,
      credit: detail.credit || 0,
      base_debit: detail.base_debit || 0,
      base_credit: detail.base_credit || 0,
      gauge: detail.gauge || 875,
      debit_g: detail.debit_g || 0,
      credit_g: detail.credit_g || 0,
      vouch_notes: detail.vouch_notes || "",
      com: 1,
      year: 1,
    };

    if (detail.id && detail.id > 0) {
      detailData.upd_date = currentDate;
      detailData.upd_user = currentUsername || null;
    } else {
      detailData.cr_date = currentDate;
      detailData.cr_user = currentUsername || null;
    }

    if (
      detail.cost_id !== undefined &&
      detail.cost_id !== null &&
      detail.cost_id > 0
    ) {
      detailData.cost = detail.cost_id;
    }

    const detailResponse =
      detail.id && detail.id > 0
        ? await voucherService.updateDetail(detail.id, detailData)
        : await voucherService.createDetail(detailData);

    if (!detailResponse.success) {
      return {
        success: false,
        error: `فشل حفظ التفصيل: ${detailResponse.message}`,
      };
    }
  }

  return { success: true };
}
