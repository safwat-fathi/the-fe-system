"use client";

import { Voucher } from "@/types/voucher";

interface BalanceVoucherHeaderProps {
  voucher: Voucher;
  voucherTypes: any[];
  currentTime: string;
}

export default function BalanceVoucherHeader({
  voucher,
  voucherTypes,
  currentTime,
}: BalanceVoucherHeaderProps) {
  return (
    <div className="bg-gradient-to-r from-slate-50 to-gray-50 rounded-lg p-3 mb-4 border border-slate-200">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-3">
          <div>
            <h1 className="text-3xl font-bold text-slate-800 flex items-center gap-4">
              <span>
                {voucherTypes.find((t) => t.id === voucher.vouch_type)?.name ||
                  "قيد افتتاحي"}
              </span>
              <span className="text-slate-600 font-medium text-2xl">
                #
                {voucher.vouch_id &&
                voucher.vouch_id > 0 &&
                isFinite(voucher.vouch_id)
                  ? voucher.vouch_id
                  : voucher.id
                    ? `DB-${voucher.id}`
                    : "جاري الترقيم..."}
              </span>

              {voucher.vouch_status === 2 && (
                <span className="text-sm bg-emerald-200 text-emerald-900 px-3 py-1 rounded-full font-bold">
                  <i className="bi bi-check2-square me-1" />
                  مرحل
                </span>
              )}
            </h1>
          </div>
        </div>
      </div>
    </div>
  );
}
