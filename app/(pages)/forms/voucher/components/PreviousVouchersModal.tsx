"use client";

import { formatAmount } from "@/utilities/formatAmount";

interface PreviousVouchersModalProps {
  isOpen: boolean;
  onClose: () => void;
  vouchersList: any[];
  voucherTypes: any[];
  voucherStatuses: any[];
  searchTerm: string;
  onSearchChange: (value: string) => void;
  onSelectVoucher: (voucher: any) => void;
}

export default function PreviousVouchersModal({
  isOpen,
  onClose,
  vouchersList,
  voucherTypes,
  voucherStatuses,
  searchTerm,
  onSearchChange,
  onSelectVoucher,
}: PreviousVouchersModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg w-full max-w-4xl max-h-[80vh] overflow-hidden">
        <div className="bg-slate-50 border-b border-slate-200 p-4">
          <h3 className="text-lg font-semibold text-slate-800">
            اختر قيد سابق
          </h3>
        </div>

        <div className="p-4">
          <input
            className="w-full mb-4 text-sm border border-slate-300 rounded-md px-3 py-2 focus:border-slate-500 focus:ring-1 focus:ring-slate-500"
            placeholder="بحث في القيود..."
            value={searchTerm}
            onChange={(e) => onSearchChange(e.target.value)}
          />

          <div className="max-h-96 overflow-y-auto">
            <table className="w-full text-sm border-collapse">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200">
                  <th className="text-right p-2 font-medium text-slate-700">
                    رقم القيد
                  </th>
                  <th className="text-right p-2 font-medium text-slate-700">
                    التاريخ
                  </th>
                  <th className="text-right p-2 font-medium text-slate-700">
                    النوع
                  </th>
                  <th className="text-right p-2 font-medium text-slate-700">
                    المبلغ
                  </th>
                  <th className="text-right p-2 font-medium text-slate-700">
                    الحالة
                  </th>
                  <th className="text-right p-2 font-medium text-slate-700">
                    إجراء
                  </th>
                </tr>
              </thead>
              <tbody>
                {vouchersList
                  .filter(
                    (v) =>
                      v.vouch_id.toString().includes(searchTerm) ||
                      v.vouch_date.includes(searchTerm) ||
                      v.vouch_notes?.includes(searchTerm),
                  )
                  .map((v) => (
                    <tr
                      key={v.vouch_id}
                      className="border-b border-slate-100 hover:bg-slate-50"
                    >
                      <td className="p-2 text-slate-800">{v.vouch_id}</td>
                      <td className="p-2 text-slate-600">{v.vouch_date}</td>
                      <td className="p-2 text-slate-600">
                        {voucherTypes.find((t) => t.id === v.vouch_type)
                          ?.name || "غير محدد"}
                      </td>
                      <td className="p-2 text-slate-800">
                        {formatAmount(v.vouch_amt || 0)}
                      </td>
                      <td className="p-2">
                        <span
                          className={`text-xs px-2 py-1 rounded-full ${
                            v.vouch_status === 2
                              ? "bg-emerald-100 text-emerald-800"
                              : "bg-yellow-100 text-yellow-800"
                          }`}
                        >
                          {voucherStatuses.find((s) => s.id === v.vouch_status)
                            ?.name || "غير محدد"}
                        </span>
                      </td>
                      <td className="p-2">
                        <button
                          className="h-6 px-2 text-xs bg-blue-600 text-white hover:bg-blue-700 border border-blue-600 rounded-md shadow-sm"
                          onClick={() => onSelectVoucher(v)}
                        >
                          <i className="bi bi-check text-xs me-1" />
                          اختيار
                        </button>
                      </td>
                    </tr>
                  ))}
              </tbody>
            </table>
          </div>
        </div>

        <div className="bg-slate-50 border-t border-slate-200 p-4 flex justify-end">
          <button
            className="h-8 px-3 text-xs bg-red-600 text-white hover:bg-red-700 border border-red-600 rounded-md shadow-sm"
            onClick={onClose}
          >
            <i className="bi bi-x-circle me-1" />
            إلغاء
          </button>
        </div>
      </div>
    </div>
  );
}
