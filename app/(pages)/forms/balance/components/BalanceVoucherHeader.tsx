"use client";

import { Voucher } from "@/types/voucher";

interface BalanceVoucherHeaderProps {
  voucher: Voucher;
  voucherTypes: any[];
  currentTime: string;
  isLoading: boolean;
  isPrinting: boolean;
  isBalanced: boolean;
  isEditing?: boolean;
  formMode?: "new" | "edit" | "preview";
  onSave: () => void;
  onPrint: () => void;
  onEditClick?: () => void;
}

export default function BalanceVoucherHeader({
  voucher,
  voucherTypes,
  currentTime,
  isLoading,
  isPrinting,
  isBalanced,
  isEditing = true,
  formMode = "new",
  onSave,
  onPrint,
  onEditClick,
}: BalanceVoucherHeaderProps) {
  return (
    <div className="bg-gradient-to-r from-slate-50 to-gray-50 rounded-lg p-3 mb-4 border border-slate-200">
      {/* الصف الأول: معلومات القيد */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-3">
          <div>
            <h1 className="text-2xl font-bold text-slate-800 flex items-center gap-4">
              <span>
                {voucherTypes.find((t) => t.id === voucher.vouch_type)?.name ||
                  "قيد افتتاحي"}
              </span>
              <span className="text-slate-600 font-medium">
                #
                {voucher.vouch_id &&
                voucher.vouch_id > 0 &&
                isFinite(voucher.vouch_id)
                  ? voucher.vouch_id
                  : voucher.id
                    ? `DB-${voucher.id}`
                    : "جاري الترقيم..."}
              </span>
              <span className="text-sm text-slate-600 font-medium flex items-center gap-1">
                <i className="bi bi-calendar3 w-4 h-4 text-slate-500" />
                {new Date(voucher.vouch_date).toLocaleString("ar-EG")}
              </span>
            </h1>
          </div>
        </div>
      </div>

      {/* الصف الثاني: الأزرار والحالة */}
      <div className="flex items-center justify-between">
        {/* الأزرار من اليسار لليمين */}
        <div className="flex items-center gap-2">
          <button
            className="h-7 px-3 text-xs bg-emerald-600 text-white hover:bg-emerald-700 border border-emerald-600 rounded-md shadow-sm disabled:opacity-50"
            disabled={isLoading || !isEditing}
            onClick={onSave}
          >
            {isLoading ? (
              <span className="flex items-center gap-1">
                <div className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin" />
                حفظ...
              </span>
            ) : (
              <span className="flex items-center gap-1">
                <i className="bi bi-check-circle w-4 h-4" />
                حفظ
              </span>
            )}
          </button>

          <button
            className={`h-7 px-3 text-xs border rounded-md shadow-sm ${
              formMode === "new" || isEditing
                ? "bg-gray-400 text-white border-gray-400 cursor-not-allowed opacity-50"
                : "bg-blue-600 text-white hover:bg-blue-700 border-blue-600"
            }`}
            disabled={formMode === "new" || isEditing || isLoading}
            title={
              formMode === "new"
                ? "لا يمكن التعديل في وضع جديد"
                : isEditing
                  ? "أنت بالفعل في وضع التعديل"
                  : "تعديل القيد"
            }
            onClick={onEditClick}
          >
            <i className="bi bi-pencil-square w-4 h-4 me-1" />
            تعديل
          </button>

          <button
            className="h-7 px-3 text-xs bg-slate-600 text-white hover:bg-slate-700 border border-slate-600 rounded-md shadow-sm disabled:opacity-50"
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
                <i className="bi bi-printer w-4 h-4 me-1" />
                طباعة
              </span>
            )}
          </button>
        </div>

        {/* حالة القيد */}
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1">
            <input
              readOnly
              checked={voucher.commit}
              className="w-3 h-3 text-emerald-600 bg-gray-100 border-gray-300 rounded focus:ring-emerald-500"
              type="checkbox"
            />
            <span className="text-xs text-slate-600">حُفظ</span>
          </div>

          <div className="flex items-center gap-1">
            <input
              readOnly
              checked={voucher.post}
              className="w-3 h-3 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500"
              type="checkbox"
            />
            <span className="text-xs text-slate-600">مرحل</span>
          </div>

          <div className="flex items-center gap-1">
            <input
              readOnly
              checked={voucher.print}
              className="w-3 h-3 text-yellow-600 bg-gray-100 border-gray-300 rounded focus:ring-yellow-500"
              type="checkbox"
            />
            <span className="text-xs text-slate-600">طُبع</span>
          </div>
        </div>
      </div>
    </div>
  );
}
