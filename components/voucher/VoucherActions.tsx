"use client";

import { Voucher } from "@/types/voucher";

interface VoucherActionsProps {
  voucher: Voucher;
  isLoading: boolean;
  isPrinting: boolean;
  onSave: () => void;
  onEdit: () => void;
  onNew: () => void;
  onPrint: () => void;
  onCreateFromPrevious: () => void;
}

export default function VoucherActions({
  voucher,
  isLoading,
  isPrinting,
  onSave,
  onEdit,
  onNew,
  onPrint,
  onCreateFromPrevious
}: VoucherActionsProps) {
  return (
    <div className="flex items-center gap-2">
      <button
        className="h-8 px-4 text-sm bg-emerald-600 text-white hover:bg-emerald-700 border border-emerald-600 rounded-md shadow-sm font-medium disabled:opacity-50"
        onClick={onSave}
        disabled={isLoading}
      >
        {isLoading ? (
          <span className="flex items-center gap-1">
            <div className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
            حفظ...
          </span>
        ) : (
          <span className="flex items-center gap-1">
            <i className="bi bi-check-circle"></i>
            حفظ
          </span>
        )}
      </button>

      <button
        className="h-8 px-4 text-sm bg-slate-100 text-slate-700 hover:bg-slate-200 border border-slate-300 rounded-md shadow-sm font-medium"
        onClick={onEdit}
      >
        <i className="bi bi-pencil-square me-1"></i>
        تعديل
      </button>

      <button
        className="h-8 px-4 text-sm bg-blue-600 text-white hover:bg-blue-700 border border-blue-600 rounded-md shadow-sm font-medium"
        onClick={onNew}
      >
        <i className="bi bi-plus-circle me-1"></i>
        جديد
      </button>

      <button
        className="h-8 px-4 text-sm bg-slate-600 text-white hover:bg-slate-700 border border-slate-600 rounded-md shadow-sm font-medium disabled:opacity-50"
        onClick={onPrint}
        disabled={isPrinting}
      >
        {isPrinting ? (
          <span className="flex items-center gap-1">
            <div className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
            طباعة...
          </span>
        ) : (
          <span className="flex items-center gap-1">
            <i className="bi bi-printer"></i>
            طباعة
          </span>
        )}
      </button>

      <button
        className="h-8 px-4 text-sm bg-slate-100 text-slate-700 hover:bg-slate-200 border border-slate-300 rounded-md shadow-sm font-medium"
        onClick={onCreateFromPrevious}
      >
        <i className="bi bi-files me-1"></i>
        انشاء من قيد سابق
      </button>
    </div>
  );
}
