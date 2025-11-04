/**
 * Voucher Totals Component
 * مكون إجماليات السندات
 */

"use client";

import { useMemo } from "react";
import { Voucher } from "@/types/voucher";
import { formatAmount } from "@/utilities/formatAmount";

interface VoucherTotalsProps {
  vouchers: Voucher[];
  calculateVoucherCashTotal: (voucher: Voucher) => number;
  calculateVoucherGoldTotal: (voucher: Voucher) => number;
  voucherDetails: Record<number, any[]>;
}

export default function VoucherTotals({
  vouchers,
  calculateVoucherCashTotal,
  calculateVoucherGoldTotal,
  voucherDetails,
}: VoucherTotalsProps) {
  const totals = useMemo(() => {
    return vouchers.reduce(
      (acc, voucher) => {
        acc.totalAmount += calculateVoucherCashTotal(voucher);
        acc.totalCount += 1;
        acc.totalGold += calculateVoucherGoldTotal(voucher);
        return acc;
      },
      { totalAmount: 0, totalCount: 0, totalGold: 0 },
    );
  }, [vouchers, voucherDetails, calculateVoucherCashTotal, calculateVoucherGoldTotal]);

  return (
    <div className="flex justify-between items-center mt-2">
      <div className="text-sm text-gray-600">
        إجمالي السندات: {totals.totalCount} سند | إجمالي المبلغ:{" "}
        {formatAmount(totals.totalAmount)} | إجمالي الجرام:{" "}
        {formatAmount(totals.totalGold)} جم
      </div>
    </div>
  );
}

