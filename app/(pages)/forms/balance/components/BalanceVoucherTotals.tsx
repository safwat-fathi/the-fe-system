"use client";

import { RiyalIcon } from "@/components/RiyalIcon";
import { formatAmount } from "@/utilities/formatAmount";

interface BalanceVoucherTotalsProps {
  totals: {
    totalDebit: number;
    totalCredit: number;
    totalDebitG: number;
    totalCreditG: number;
    totalTax: number;
    totalTaxPrc: number;
  };
}

export default function BalanceVoucherTotals({
  totals,
}: BalanceVoucherTotalsProps) {
  return (
    <div className="mt-1 bg-gray-50 rounded-lg p-3 border border-gray-200">
      <div className="flex flex-wrap items-center justify-between gap-6 text-sm">
        <div className="flex items-center gap-2">
          <span className="text-gray-700 font-medium">إجمالي المدين:</span>
          <span className="font-semibold text-emerald-700 flex items-center gap-1">
            {formatAmount(totals.totalDebit)}
            <RiyalIcon color="currentColor" />
          </span>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-gray-700 font-medium">إجمالي الدائن:</span>
          <span className="font-semibold text-red-700 flex items-center gap-1">
            {formatAmount(totals.totalCredit)}
            <RiyalIcon color="currentColor" />
          </span>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-amber-800 font-medium">
            إجمالي المدين المعاير:
          </span>
          <span className="font-semibold text-yellow-600 flex items-center gap-1">
            {formatAmount(totals.totalDebitG)}
            <span className="text-xs text-yellow-500">جم</span>
          </span>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-amber-800 font-medium">
            إجمالي الدائن المعاير:
          </span>
          <span className="font-semibold text-yellow-600 flex items-center gap-1">
            {formatAmount(totals.totalCreditG)}
            <span className="text-xs text-yellow-500">جم</span>
          </span>
        </div>
      </div>
    </div>
  );
}
