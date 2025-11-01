"use client";

import { Voucher } from "@/types/voucher";

interface BalanceVoucherFormProps {
  voucher: Voucher;
  currentTime: string;
  isEditing?: boolean;
  onVoucherChange: (field: keyof Voucher, value: any) => void;
}

export default function BalanceVoucherForm({
  voucher,
  currentTime,
  isEditing = true,
  onVoucherChange,
}: BalanceVoucherFormProps) {
  return (
    <div className="bg-white rounded-lg border border-slate-200 mb-4">
      <div className="p-4">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {/* رقم المرجع */}
          <div className="flex flex-col gap-1">
            <label className="text-sm font-medium text-slate-700">
              رقم المرجع
            </label>
            <input
              className="text-sm border border-slate-300 rounded-md px-3 py-2 focus:border-slate-500 focus:ring-1 focus:ring-slate-500"
              disabled={!isEditing}
              placeholder="أدخل رقم المرجع"
              readOnly={!isEditing}
              value={voucher.ref_no || ""}
              onChange={(e) => onVoucherChange("ref_no", e.target.value)}
            />
          </div>

          {/* تاريخ ووقت القيد */}
          <div className="flex flex-col gap-1">
            <label className="text-sm font-medium text-slate-700">
              تاريخ ووقت القيد
            </label>
            <input
              className="text-sm border border-slate-300 rounded-md px-3 py-2 focus:border-slate-500 focus:ring-1 focus:ring-slate-500"
              disabled={!isEditing}
              readOnly={!isEditing}
              type="datetime-local"
              value={
                voucher.vouch_date
                  ? new Date(voucher.vouch_date).toISOString().slice(0, 16)
                  : ""
              }
              onChange={(e) => onVoucherChange("vouch_date", e.target.value)}
            />
          </div>

          {/* البيان */}
          <div className="flex flex-col gap-1">
            <label className="text-sm font-medium text-slate-700">البيان</label>
            <input
              className="text-sm border border-slate-300 rounded-md px-3 py-2 focus:border-slate-500 focus:ring-1 focus:ring-slate-500"
              disabled={!isEditing}
              placeholder="أدخل بيان القيد"
              readOnly={!isEditing}
              value={voucher.vouch_notes || ""}
              onChange={(e) => onVoucherChange("vouch_notes", e.target.value)}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
