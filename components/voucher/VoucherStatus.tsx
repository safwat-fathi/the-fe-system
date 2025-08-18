"use client";

import { Voucher } from "@/types/voucher";

interface VoucherStatusProps {
  voucher: Voucher;
}

export default function VoucherStatus({ voucher }: VoucherStatusProps) {
  return (
    <div className="flex items-center gap-3">
      <div className="flex items-center gap-1">
        <input
          type="checkbox"
          checked={voucher.commit}
          readOnly
          className="w-3 h-3 text-emerald-600 bg-gray-100 border-gray-300 rounded focus:ring-emerald-500"
        />
        <span className="text-xs text-slate-600">حُفظ</span>
      </div>
      
      <div className="flex items-center gap-1">
        <input
          type="checkbox"
          checked={voucher.post}
          readOnly
          className="w-3 h-3 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500"
        />
        <span className="text-xs text-slate-600">مرحل</span>
      </div>
      
      <div className="flex items-center gap-1">
        <input
          type="checkbox"
          checked={voucher.print}
          readOnly
          className="w-3 h-3 text-yellow-600 bg-gray-100 border-gray-300 rounded focus:ring-yellow-500"
        />
        <span className="text-xs text-slate-600">طُبع</span>
      </div>
    </div>
  );
}
