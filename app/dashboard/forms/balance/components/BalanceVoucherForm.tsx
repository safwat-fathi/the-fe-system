"use client";

import { Voucher } from "@/types/voucher";

interface BalanceVoucherFormProps {
  voucher: Voucher;
  currentTime: string;
  onVoucherChange: (field: keyof Voucher, value: any) => void;
}

export default function BalanceVoucherForm({
  voucher,
  currentTime,
  onVoucherChange
}: BalanceVoucherFormProps) {
  return (
    <div className="bg-white rounded-lg border border-slate-200 mb-4">
      <div className="p-4">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {/* رقم المرجع */}
          <div className="flex flex-col gap-1">
            <label className="text-sm font-medium text-slate-700">رقم المرجع</label>
            <input
              value={voucher.ref_no || ""}
              onChange={(e) => onVoucherChange("ref_no", e.target.value)}
              className="text-sm border border-slate-300 rounded-md px-3 py-2 focus:border-slate-500 focus:ring-1 focus:ring-slate-500"
              placeholder="أدخل رقم المرجع"
            />
          </div>

          {/* تاريخ ووقت القيد */}
          <div className="flex flex-col gap-1">
            <label className="text-sm font-medium text-slate-700">تاريخ ووقت القيد</label>
            <input
              value={`${voucher.vouch_date} ${currentTime}`}
              readOnly
              className="text-sm border border-slate-300 rounded-md px-3 py-2 bg-slate-50"
            />
          </div>

          {/* البيان */}
          <div className="flex flex-col gap-1">
            <label className="text-sm font-medium text-slate-700">البيان</label>
            <input
              value={voucher.vouch_notes || ""}
              onChange={(e) => onVoucherChange("vouch_notes", e.target.value)}
              className="text-sm border border-slate-300 rounded-md px-3 py-2 focus:border-slate-500 focus:ring-1 focus:ring-slate-500"
              placeholder="أدخل بيان القيد"
            />
          </div>
        </div>
      </div>
    </div>
  );
}
