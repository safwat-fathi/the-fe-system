/**
 * Helper functions to process voucher details
 */

"use server";

import type { VoucherDetailData } from "./types";

import { voucherService } from "@/services/api";
import { parseNumber } from "@/utilities/voucherForm";

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

    const debitValue =
      detail.debit !== undefined && detail.debit !== null
        ? parseNumber(detail.debit)
        : 0;
    const creditValue =
      detail.credit !== undefined && detail.credit !== null
        ? parseNumber(detail.credit)
        : 0;
    const gaugeValue =
      detail.gauge !== undefined && detail.gauge !== null
        ? parseNumber(detail.gauge) || 875
        : 875;
    const gDebitValue =
      detail.g_debit !== undefined && detail.g_debit !== null
        ? parseNumber(detail.g_debit)
        : 0;
    const gCreditValue =
      detail.g_credit !== undefined && detail.g_credit !== null
        ? parseNumber(detail.g_credit)
        : 0;
    const gDebitBaseValue =
      detail.g_debit_base !== undefined && detail.g_debit_base !== null
        ? parseNumber(detail.g_debit_base)
        : 0;
    const gCreditBaseValue =
      detail.g_credit_base !== undefined && detail.g_credit_base !== null
        ? parseNumber(detail.g_credit_base)
        : 0;

    const detailData: any = {
      vouch: masterId,
      acc: detail.acc_id,
      debit: debitValue,
      credit: creditValue,
      debit_base: debitValue,
      credit_base: creditValue,
      gauge: gaugeValue,
      g_debit: gDebitValue,
      g_credit: gCreditValue,
      // تقريب g_debit_base و g_credit_base إلى منزلتين عشريتين فقط (متطلبات الـ backend)
      g_debit_base: parseFloat(gDebitBaseValue.toFixed(2)),
      g_credit_base: parseFloat(gCreditBaseValue.toFixed(2)),
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

    const debitValue =
      detail.debit !== undefined && detail.debit !== null
        ? parseNumber(detail.debit)
        : 0;
    const creditValue =
      detail.credit !== undefined && detail.credit !== null
        ? parseNumber(detail.credit)
        : 0;
    const gaugeValue =
      detail.gauge !== undefined && detail.gauge !== null
        ? parseNumber(detail.gauge) || 875
        : 875;
    const gDebitValue =
      detail.g_debit !== undefined && detail.g_debit !== null
        ? parseNumber(detail.g_debit)
        : 0;
    const gCreditValue =
      detail.g_credit !== undefined && detail.g_credit !== null
        ? parseNumber(detail.g_credit)
        : 0;
    const gDebitBaseValue =
      detail.g_debit_base !== undefined && detail.g_debit_base !== null
        ? parseNumber(detail.g_debit_base)
        : 0;
    const gCreditBaseValue =
      detail.g_credit_base !== undefined && detail.g_credit_base !== null
        ? parseNumber(detail.g_credit_base)
        : 0;

    const detailData: any = {
      vouch: realVoucherId,
      acc: detail.acc_id,
      debit: debitValue,
      credit: creditValue,
      debit_base: debitValue,
      credit_base: creditValue,
      gauge: gaugeValue,
      g_debit: gDebitValue,
      g_credit: gCreditValue,
      // تقريب g_debit_base و g_credit_base إلى منزلتين عشريتين فقط (متطلبات الـ backend)
      g_debit_base: parseFloat(gDebitBaseValue.toFixed(2)),
      g_credit_base: parseFloat(gCreditBaseValue.toFixed(2)),
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
