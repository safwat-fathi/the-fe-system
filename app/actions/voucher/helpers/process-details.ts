/**
 * Helper functions to process voucher details
 */

"use server";

import type { VoucherDetailData } from "./types";

import { voucherService } from "@/services/api";
import { parseNumber } from "@/utilities/voucherForm";

const NUMERIC_TOLERANCE = 0.01;

interface SanitizedDetail {
  payload: any;
  debit: number;
  credit: number;
  gDebitBase: number;
  gCreditBase: number;
  id?: number;
  isUpdate?: boolean;
}

function sanitizeDetailData(
  detail: VoucherDetailData,
  voucherId: number,
  currentDate: string,
  currentUsername: string | null,
  isUpdate: boolean,
): SanitizedDetail | null {
  if (!detail.acc_id || detail.acc_id === 0) {
    return null;
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
      : gDebitValue;
  const gCreditBaseValue =
    detail.g_credit_base !== undefined && detail.g_credit_base !== null
      ? parseNumber(detail.g_credit_base)
      : gCreditValue;

  const payload: any = {
    vouch: voucherId,
    acc: detail.acc_id,
    debit: debitValue,
    credit: creditValue,
    debit_base: debitValue,
    credit_base: creditValue,
    gauge: gaugeValue,
    g_debit: gDebitValue,
    g_credit: gCreditValue,
    g_debit_base: parseFloat(gDebitBaseValue.toFixed(2)),
    g_credit_base: parseFloat(gCreditBaseValue.toFixed(2)),
    vouch_notes: detail.vouch_notes || "",
    com: 1,
    year: 1,
  };

  if (isUpdate) {
    if (detail.id && detail.id > 0) {
      payload.upd_date = currentDate;
      payload.upd_user = currentUsername || null;
    } else {
      payload.cr_date = currentDate;
      payload.cr_user = currentUsername || null;
    }
  } else {
    payload.cr_date = currentDate;
    payload.cr_user = currentUsername || null;
  }

  if (
    detail.cost_id !== undefined &&
    detail.cost_id !== null &&
    detail.cost_id > 0
  ) {
    payload.cost = detail.cost_id;
  }

  return {
    payload,
    debit: debitValue,
    credit: creditValue,
    gDebitBase: payload.g_debit_base,
    gCreditBase: payload.g_credit_base,
    id: detail.id,
    isUpdate: detail.id !== undefined && detail.id !== null && detail.id > 0,
  };
}

function validateDetailTotals(
  sanitizedDetails: SanitizedDetail[],
  context: string,
): { success: boolean; error?: string } {
  if (sanitizedDetails.length === 0) {
    return { success: true };
  }

  const totals = sanitizedDetails.reduce(
    (acc, detail) => {
      acc.debit += detail.debit;
      acc.credit += detail.credit;
      acc.gDebit += detail.gDebitBase;
      acc.gCredit += detail.gCreditBase;

      return acc;
    },
    { debit: 0, credit: 0, gDebit: 0, gCredit: 0 },
  );

  const cashDiff = Math.abs(totals.debit - totals.credit);
  const hasBothCashSides =
    totals.debit > NUMERIC_TOLERANCE && totals.credit > NUMERIC_TOLERANCE;
  if (cashDiff > NUMERIC_TOLERANCE) {
    if (!hasBothCashSides) {
      return { success: true };
    }

    return {
      success: false,
      error: `التفاصيل غير متوازنة (${context}): إجمالي المدين ${totals.debit.toFixed(
        2,
      )} ≠ إجمالي الدائن ${totals.credit.toFixed(2)}`,
    };
  }

  const goldDiff = Math.abs(totals.gDebit - totals.gCredit);
  const hasBothGoldSides =
    totals.gDebit > NUMERIC_TOLERANCE && totals.gCredit > NUMERIC_TOLERANCE;
  if (goldDiff > NUMERIC_TOLERANCE) {
    if (!hasBothGoldSides) {
      return { success: true };
    }

    return {
      success: false,
      error: `التفاصيل الذهبية غير متوازنة (${context}): إجمالي الذهب المدين ${totals.gDebit.toFixed(
        2,
      )} ≠ إجمالي الذهب الدائن ${totals.gCredit.toFixed(2)}`,
    };
  }

  return { success: true };
}

/**
 * Process voucher details (create)
 */
export async function processVoucherDetails(
  masterId: number,
  details: VoucherDetailData[],
  currentDate: string,
  currentUsername: string | null,
): Promise<{ success: boolean; error?: string }> {
  const sanitizedDetails = details
    .map((detail) =>
      sanitizeDetailData(detail, masterId, currentDate, currentUsername, false),
    )
    .filter((detail): detail is SanitizedDetail => detail !== null);

  const validation = validateDetailTotals(
    sanitizedDetails,
    "سند جديد رقم " + masterId,
  );

  if (!validation.success) {
    return validation;
  }

  for (const detail of sanitizedDetails) {
    const detailResponse = await voucherService.createDetail(detail.payload);

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

  const sanitizedDetails = details
    .map((detail) =>
      sanitizeDetailData(
        detail,
        realVoucherId,
        currentDate,
        currentUsername,
        true,
      ),
    )
    .filter((detail): detail is SanitizedDetail => detail !== null);

  const validation = validateDetailTotals(
    sanitizedDetails,
    "تحديث سند رقم " + realVoucherId,
  );

  if (!validation.success) {
    return validation;
  }

  for (const detail of sanitizedDetails) {
    const detailResponse =
      detail.isUpdate && detail.id && detail.id > 0
        ? await voucherService.updateDetail(detail.id, detail.payload)
        : await voucherService.createDetail(detail.payload);

    if (!detailResponse.success) {
      return {
        success: false,
        error: `فشل حفظ التفصيل: ${detailResponse.message}`,
      };
    }
  }

  return { success: true };
}
