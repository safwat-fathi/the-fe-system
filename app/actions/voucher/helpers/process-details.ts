/**
 * Helper functions to process voucher details
 */

"use server";

import type { VoucherDetailData } from "./types";

import { voucherService } from "@/services/api";
import { parseNumber } from "@/utilities/voucherForm";

const NUMERIC_TOLERANCE = 0.01;
const MISSING_COST_CENTER_MESSAGE = "يرجى اختيار مركز التكلفة قبل الحفظ.";

export interface NormalizedDetail {
  payload: any;
  debit: number;
  credit: number;
  gDebitBase: number;
  gCreditBase: number;
  id?: number;
  isUpdate?: boolean;
  trans_type?: number | null;
  vouch_type?: number | null;
}

const formatParallelErrors = (context: string, messages: string[]): string => {
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

const normalizeDetailApiErrorMessage = (rawMessage?: string): string => {
  if (!rawMessage || typeof rawMessage !== "string") {
    return "خطأ غير معروف";
  }

  const lowerMessage = rawMessage.toLowerCase();
  const hasCostKey = lowerMessage.includes('"cost"') || lowerMessage.includes("cost");
  const hasRequiredHint =
    lowerMessage.includes("this field is required") ||
    lowerMessage.includes("field is required");

  if (hasCostKey && hasRequiredHint) {
    return MISSING_COST_CENTER_MESSAGE;
  }

  return rawMessage;
};

function sanitizeDetailData(
  detail: VoucherDetailData,
  voucherId: number,
  currentDate: string,
  currentUsername: string | null,
  companyId: number,
  year: number,
  isUpdate: boolean,
): NormalizedDetail | null {
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
    com: companyId,
    year,
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
  normalizedDetails: NormalizedDetail[],
  context: string,
  voucherType: number,
): { success: boolean; error?: string } {
  if (normalizedDetails.length === 0) {
    return { success: true };
  }

  const totals = normalizedDetails.reduce(
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

  if (cashDiff > NUMERIC_TOLERANCE && voucherType !== 0) {
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
  const firstDetail = normalizedDetails[0];
  const detailVoucherType =
    firstDetail?.payload?.trans_type ??
    firstDetail?.payload?.vouch_type ??
    firstDetail?.trans_type ??
    firstDetail?.vouch_type ??
    null;

  if (
    goldDiff > NUMERIC_TOLERANCE &&
    hasBothGoldSides &&
    (detailVoucherType ?? voucherType) !== 0
  ) {
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
  voucherType: number,
  companyId: number,
  year: number,
): Promise<{
  success: boolean;
  error?: string;
  normalizedDetails?: NormalizedDetail[];
}> {
  const normalizedDetails = details
    .map((detail) =>
      sanitizeDetailData(
        detail,
        masterId,
        currentDate,
        currentUsername,
        companyId,
        year,
        false,
      ),
    )
    .filter((detail): detail is NormalizedDetail => detail !== null);

  const validation = validateDetailTotals(
    normalizedDetails,
    "سند جديد رقم " + masterId,
    voucherType,
  );

  if (!validation.success) {
    return validation;
  }

  if (normalizedDetails.length === 0) {
    return { success: true, normalizedDetails };
  }

  const creationResults = await Promise.allSettled(
    normalizedDetails.map((detail) =>
      voucherService.createDetail(detail.payload).then((response) => {
        if (!response.success) {
          const normalizedMessage = normalizeDetailApiErrorMessage(
            response.message,
          );

          throw new Error(
            normalizedMessage ||
              `فشل حفظ التفصيل للحساب ${detail.payload?.acc ?? ""}`,
          );
        }

        return response;
      }),
    ),
  );

  const creationErrors = collectSettledErrors(creationResults);

  if (creationErrors.length > 0) {
    return {
      success: false,
      error: formatParallelErrors("أخطاء حفظ التفاصيل", creationErrors),
    };
  }

  return { success: true, normalizedDetails };
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
  voucherType: number,
  year: number,
): Promise<{
  success: boolean;
  error?: string;
  normalizedDetails?: NormalizedDetail[];
}> {
  if (deletedDetailIds.length > 0) {
    const deleteResults = await Promise.allSettled(
      deletedDetailIds
        .filter((detailId) => detailId && detailId > 0)
        .map((detailId) =>
          voucherService.deleteDetail(detailId).then((response) => {
            if (!response.success) {
              throw new Error(
                response.message ||
                  `فشل حذف التفصيل رقم ${detailId.toString()}`,
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
        error: formatParallelErrors("أخطاء حذف التفاصيل", deleteErrors),
      };
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
        branchId,
        year,
        true,
      ),
    )
    .filter((detail): detail is NormalizedDetail => detail !== null);

  const validation = validateDetailTotals(
    sanitizedDetails,
    "تحديث سند رقم " + realVoucherId,
    voucherType,
  );

  if (!validation.success) {
    return validation;
  }

  const updateOperations = sanitizedDetails
    .filter((detail): detail is NormalizedDetail & { id: number } =>
      Boolean(detail.isUpdate && detail.id && detail.id > 0),
    )
    .map((detail) =>
      voucherService
        .updateDetail(detail.id!, detail.payload)
        .then((response) => {
          if (!response.success) {
            const normalizedMessage = normalizeDetailApiErrorMessage(
              response.message,
            );

            throw new Error(
              normalizedMessage ||
                `فشل تعديل التفصيل للحساب ${detail.payload?.acc ?? ""}`,
            );
          }

          return response;
        }),
    );

  const createOperations = sanitizedDetails
    .filter((detail) => !detail.isUpdate || !detail.id || detail.id <= 0)
    .map((detail) =>
      voucherService.createDetail(detail.payload).then((response) => {
        if (!response.success) {
          const normalizedMessage = normalizeDetailApiErrorMessage(
            response.message,
          );

          throw new Error(
            normalizedMessage ||
              `فشل إضافة التفصيل للحساب ${detail.payload?.acc ?? ""}`,
          );
        }

        return response;
      }),
    );

  const allOperations = [...updateOperations, ...createOperations];
  const settledResults =
    allOperations.length > 0 ? await Promise.allSettled(allOperations) : [];

  const operationErrors = collectSettledErrors(settledResults);

  if (operationErrors.length > 0) {
    return {
      success: false,
      error: formatParallelErrors("أخطاء حفظ/تحديث التفاصيل", operationErrors),
    };
  }

  return { success: true, normalizedDetails: sanitizedDetails };
}
