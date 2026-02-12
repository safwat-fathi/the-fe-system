import type { VoucherDetail } from "@/types/voucher";

import { parseNumber } from "@/utilities/voucherForm";

export interface AdjustmentTotalsResult {
  totalDebit: number;
  totalCredit: number;
  totalDebitG: number;
  totalCreditG: number;
}

export function calculateAdjustmentTotals(
  details: VoucherDetail[],
): AdjustmentTotalsResult {
  return details.reduce<AdjustmentTotalsResult>(
    (totals, detail) => {
      const debit = detail.debit !== undefined ? parseNumber(detail.debit) : 0;
      const credit =
        detail.credit !== undefined ? parseNumber(detail.credit) : 0;

      const debitG =
        detail.g_debit_base !== undefined
          ? parseNumber(detail.g_debit_base)
          : detail.debit_g !== undefined
            ? parseNumber(detail.debit_g)
            : 0;
      const creditG =
        detail.g_credit_base !== undefined
          ? parseNumber(detail.g_credit_base)
          : detail.credit_g !== undefined
            ? parseNumber(detail.credit_g)
            : 0;

      return {
        totalDebit: totals.totalDebit + debit,
        totalCredit: totals.totalCredit + credit,
        totalDebitG: totals.totalDebitG + debitG,
        totalCreditG: totals.totalCreditG + creditG,
      };
    },
    {
      totalDebit: 0,
      totalCredit: 0,
      totalDebitG: 0,
      totalCreditG: 0,
    },
  );
}
