"use client";

import { Voucher } from "@/types/voucher";

interface VoucherFormProps {
  voucher: Voucher;
  currentTime: string;
  voucherTypes: any[];
  voucherStatuses: any[];
  onVoucherChange: (field: keyof Voucher, value: any) => void;
  onVoucherTypeChange: (newType: number) => void;
}

export default function VoucherForm({
  voucher,
  currentTime,
  voucherTypes,
  voucherStatuses,
  onVoucherChange,
  onVoucherTypeChange,
}: VoucherFormProps) {
  return (
    <div className="bg-white rounded-lg border border-slate-200 mb-4">
      <div className="p-4">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* رقم المرجع */}
          <div className="flex flex-col gap-1">
            <label className="text-sm font-medium text-slate-700">
              رقم المرجع
            </label>
            <input
              className="text-sm border border-slate-300 rounded-md px-3 py-2 focus:border-slate-500 focus:ring-1 focus:ring-slate-500"
              placeholder="أدخل رقم المرجع"
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
              type="datetime-local"
              className="text-sm border border-slate-300 rounded-md px-3 py-2 focus:border-slate-500 focus:ring-1 focus:ring-slate-500"
              value={voucher.vouch_date ? new Date(voucher.vouch_date).toISOString().slice(0, 16) : ""}
              onChange={(e) => onVoucherChange("vouch_date", e.target.value)}
            />
          </div>

          {/* حالة القيد */}
          <div className="flex flex-col gap-1">
            <label className="text-sm font-medium text-slate-700">
              حالة القيد
            </label>
            <select
              className="text-sm border border-slate-300 rounded-md px-3 py-2 focus:border-slate-500 focus:ring-1 focus:ring-slate-500"
              value={voucher.vouch_status || 1}
              onChange={(e) =>
                onVoucherChange("vouch_status", parseInt(e.target.value))
              }
            >
              {voucherStatuses.map((status) => (
                <option key={status.id} value={status.id}>
                  {status.name}
                </option>
              ))}
            </select>
          </div>

          {/* نوع القيد */}
          <div className="flex flex-col gap-1">
            <label className="text-sm font-medium text-slate-700">
              نوع القيد
            </label>
            <select
              className="text-sm border border-slate-300 rounded-md px-3 py-2 focus:border-slate-500 focus:ring-1 focus:ring-slate-500"
              value={voucher.vouch_type || 3}
              onChange={(e) => onVoucherTypeChange(parseInt(e.target.value))}
            >
              {voucherTypes.map((type) => (
                <option key={type.id} value={type.id}>
                  {type.name}
                </option>
              ))}
            </select>
          </div>

          {/* البيان */}
          <div className="flex flex-col gap-1 lg:col-span-2">
            <label className="text-sm font-medium text-slate-700">البيان</label>
            <input
              className="text-sm border border-slate-300 rounded-md px-3 py-2 focus:border-slate-500 focus:ring-1 focus:ring-slate-500"
              placeholder="أدخل بيان القيد"
              value={voucher.vouch_notes || ""}
              onChange={(e) => onVoucherChange("vouch_notes", e.target.value)}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
