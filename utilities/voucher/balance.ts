/**
 * Utility functions for voucher balance validation
 * التحقق من التوازن في السندات
 */

import type { VoucherDetail } from "@/types/voucher";

/**
 * Calculate voucher totals
 * حساب إجماليات السند
 */
export type VoucherTotals = {
  totalDebit: number;
  totalCredit: number;
  totalDebitG: number;
  totalCreditG: number;
  totalBaseDebit: number;
  totalBaseCredit: number;
};

/**
 * Calculate totals from voucher details
 * @param details - تفاصيل السند
 * @returns إجماليات السند
 */
export function calculateVoucherTotals(
  details: VoucherDetail[],
): VoucherTotals {
  return details.reduce(
    (totals, detail) => {
      const debit = parseFloat(String(detail.debit || 0));
      const credit = parseFloat(String(detail.credit || 0));
      const baseDebit = parseFloat(String(detail.base_debit || 0));
      const baseCredit = parseFloat(String(detail.base_credit || 0));
      // استخدام g_debit_base و g_credit_base بدلاً من debit_g و credit_g
      // لأن هذه هي القيم التي يتم ترحيلها إلى GL
      const debitG = parseFloat(
        String(
          detail.g_debit_base !== undefined
            ? detail.g_debit_base
            : detail.debit_g || 0,
        ),
      );
      const creditG = parseFloat(
        String(
          detail.g_credit_base !== undefined
            ? detail.g_credit_base
            : detail.credit_g || 0,
        ),
      );

      return {
        totalDebit: totals.totalDebit + debit,
        totalCredit: totals.totalCredit + credit,
        totalBaseDebit: totals.totalBaseDebit + baseDebit,
        totalBaseCredit: totals.totalBaseCredit + baseCredit,
        totalDebitG: totals.totalDebitG + debitG,
        totalCreditG: totals.totalCreditG + creditG,
      };
    },
    {
      totalDebit: 0,
      totalCredit: 0,
      totalBaseDebit: 0,
      totalBaseCredit: 0,
      totalDebitG: 0,
      totalCreditG: 0,
    },
  );
}

/**
 * Check if cash amounts are balanced
 * @param totals - إجماليات السند
 * @param tolerance - التسامح المسموح (افتراضي 0.01)
 * @returns true if cash is balanced
 */
export function isCashBalanced(
  totals: VoucherTotals,
  tolerance: number = 0.01,
): boolean {
  const cashBalance = totals.totalDebit - totals.totalCredit;

  return Math.abs(cashBalance) < tolerance;
}

/**
 * Check if gold amounts are balanced
 * @param totals - إجماليات السند
 * @param tolerance - التسامح المسموح (افتراضي 0.01)
 * @returns true if gold is balanced
 */
export function isGoldBalanced(
  totals: VoucherTotals,
  tolerance: number = 0.01,
): boolean {
  const goldBalance = totals.totalDebitG - totals.totalCreditG;

  return Math.abs(goldBalance) < tolerance;
}

/**
 * Check if voucher is fully balanced (cash + gold)
 * @param totals - إجماليات السند
 * @param tolerance - التسامح المسموح (افتراضي 0.01)
 * @returns true if voucher is balanced
 */
export function isVoucherBalanced(
  totals: VoucherTotals,
  tolerance: number = 0.01,
): boolean {
  return isCashBalanced(totals, tolerance) && isGoldBalanced(totals, tolerance);
}

/**
 * Validate voucher balance for cash and gold vouchers
 * @param details - تفاصيل السند
 * @param voucherBoxes - صناديق السند (اختياري)
 * @param vouchType - نوع السند
 * @returns Validation result with error message if invalid
 */
export function validateVoucherBalance(
  details: VoucherDetail[],
  voucherBoxes: Array<{ amount: number }> = [],
  vouchType: number,
): { isValid: boolean; error?: string } {
  const totals = calculateVoucherTotals(details);

  // سندات القبض والصرف (1, 2, 111, 222): التحقق من توازن الصناديق مع التفاصيل فقط
  // لأن في هذه السندات، الصناديق تمثل المدين/الدائن والتفاصيل تمثل الجانب الآخر
  const isReceiptPaymentVoucher = [1, 2, 111, 222].includes(vouchType);

  if (isReceiptPaymentVoucher) {
    // التحقق من وجود صناديق
    if (voucherBoxes.length === 0) {
      return {
        isValid: false,
        error: "يرجى إدخال صندوق واحد على الأقل",
      };
    }

    const totalBoxes = voucherBoxes.reduce(
      (sum, box) => sum + (box.amount || 0),
      0,
    );

    // التحقق من وجود صناديق بصحة
    if (totalBoxes <= 0) {
      return {
        isValid: false,
        error: "يرجى إدخال مبلغ صحيح للصناديق",
      };
    }

    // في سند القبض: الصناديق (مدين) = التفاصيل (دائن)
    // في سند الصرف: الصناديق (دائن) = التفاصيل (مدين)
    const totalDetails =
      vouchType === 1 || vouchType === 111
        ? totals.totalCredit // سند قبض: مجموع الدائن
        : totals.totalDebit; // سند صرف: مجموع المدين

    if (Math.abs(totalBoxes - totalDetails) > 0.01) {
      const difference = totalBoxes - totalDetails;

      return {
        isValid: false,
        error: `غير متزن نقداً: الفرق ${Math.abs(difference).toFixed(2)}`,
      };
    }

    // التحقق من توازن الذهب (إن وجد)
    if (!isGoldBalanced(totals)) {
      const goldBalance = totals.totalDebitG - totals.totalCreditG;

      return {
        isValid: false,
        error: `غير متزن ذهباً: الفرق ${Math.abs(goldBalance).toFixed(6)} جم`,
      };
    }

    return { isValid: true };
  }

  // للسندات الأخرى (القيود العادية): التحقق من توازن المدين والدائن
  // التحقق من توازن النقد
  if (!isCashBalanced(totals)) {
    const cashBalance = totals.totalDebit - totals.totalCredit;

    return {
      isValid: false,
      error: `غير متزن نقداً: الفرق ${Math.abs(cashBalance).toFixed(2)}`,
    };
  }

  // التحقق من توازن الذهب
  if (!isGoldBalanced(totals)) {
    const goldBalance = totals.totalDebitG - totals.totalCreditG;

    return {
      isValid: false,
      error: `غير متزن ذهباً: الفرق ${Math.abs(goldBalance).toFixed(6)} جم`,
    };
  }

  return { isValid: true };
}

/**
 * Get balance summary for display
 * @param totals - إجماليات السند
 * @returns Summary object
 */
export function getBalanceSummary(totals: VoucherTotals) {
  return {
    cashBalance: totals.totalDebit - totals.totalCredit,
    goldBalance: totals.totalDebitG - totals.totalCreditG,
    isCashBalanced: isCashBalanced(totals),
    isGoldBalanced: isGoldBalanced(totals),
    isFullyBalanced: isVoucherBalanced(totals),
  };
}
