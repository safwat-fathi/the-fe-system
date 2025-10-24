"use client";

import { Voucher } from "@/types/voucher";

interface BalanceVoucherActionsProps {
  voucher: Voucher;
  isLoading: boolean;
  isPrinting: boolean;
  isBalanced: boolean;
  onSave: () => void;
  onPrint: () => void;
}

export default function BalanceVoucherActions({
  voucher,
  isLoading,
  isPrinting,
  isBalanced,
  onSave,
  onPrint,
}: BalanceVoucherActionsProps) {
  return (
    <div className="flex items-center gap-2">
      <button
        className="h-8 px-4 text-sm bg-emerald-600 text-white hover:bg-emerald-700 border border-emerald-600 rounded-md shadow-sm font-medium disabled:opacity-50"
        disabled={isLoading || !isBalanced}
        onClick={onSave}
      >
        {isLoading ? (
          <span className="flex items-center gap-1">
            <div className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin" />
            حفظ...
          </span>
        ) : (
          <span className="flex items-center gap-1">
            <i className="bi bi-check-circle" />
            حفظ
          </span>
        )}
      </button>

      <button
        className="h-8 px-4 text-sm bg-slate-600 text-white hover:bg-slate-700 border border-slate-600 rounded-md shadow-sm font-medium disabled:opacity-50"
        disabled={isPrinting || !voucher.vouch_id}
        onClick={onPrint}
      >
        {isPrinting ? (
          <span className="flex items-center gap-1">
            <div className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin" />
            طباعة...
          </span>
        ) : (
          <span className="flex items-center gap-1">
            <i className="bi bi-printer" />
            طباعة
          </span>
        )}
      </button>
    </div>
  );
}
