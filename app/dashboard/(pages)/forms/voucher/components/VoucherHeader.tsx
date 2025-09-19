"use client";

import { Voucher } from "@/types/voucher";

interface VoucherHeaderProps {
  voucher: Voucher;
  voucherTypes: any[];
  searchTerm: string;
  onSearchChange: (value: string) => void;
  onSearch: () => void;
}

export default function VoucherHeader({
  voucher,
  voucherTypes,
  searchTerm,
  onSearchChange,
  onSearch
}: VoucherHeaderProps) {
  return (
    <div className="bg-gradient-to-r from-slate-50 to-gray-50 rounded-lg p-3 mb-4 border border-slate-200">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-3">
          <div>
            <h1 className="text-3xl font-bold text-slate-800 flex items-center gap-4">
              <span>
                {voucherTypes.find(t => t.id === voucher.vouch_type)?.name || 'قيد تسوية'}
              </span>
              <span className="text-slate-600 font-medium text-2xl">
                #{voucher.vouch_id && voucher.vouch_id > 0 && isFinite(voucher.vouch_id) ? voucher.vouch_id : (voucher.id ? `DB-${voucher.id}` : 'جاري الترقيم...')}
              </span>

              {voucher.vouch_status === 2 && (
                <span className="text-sm bg-emerald-200 text-emerald-900 px-3 py-1 rounded-full font-bold">
                  <i className="bi bi-check2-square me-1"></i>
                  مرحل
                </span>
              )}
            </h1>
          </div>
        </div>

        {/* البحث */}
        <div className="flex items-center gap-2">
          <input
            className="w-40 h-8 text-sm border border-slate-300 rounded-md focus:border-slate-500 focus:ring-1 focus:ring-slate-500 px-2"
            placeholder="بحث برقم القيد..."
            type="number"
            value={searchTerm}
            onChange={(e) => onSearchChange(e.target.value)}
          />
          <button 
            className="h-8 px-3 text-sm bg-slate-600 text-white hover:bg-slate-700 border border-slate-600 rounded-md shadow-sm font-medium"
            onClick={onSearch}
          >
            <i className="bi bi-search text-sm"></i>
          </button>
        </div>
      </div>
    </div>
  );
}
