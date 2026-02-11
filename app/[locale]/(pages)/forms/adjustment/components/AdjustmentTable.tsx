import type { VoucherDetail } from "@/types/voucher";
import type { Account } from "@/types/models/account";

import {
  CheckCircleIcon,
  ExclamationTriangleIcon,
} from "@heroicons/react/24/outline";
import { useTranslations } from "next-intl";

import { adjustmentTableColumns } from "../constants";

import AdjustmentColumn from "./AdjustmentColumn";

interface AdjustmentTableProps {
  isEditing: boolean;
  addDetailRow: () => void;
  textAlign: string;
  isVoucherBalanced?: boolean;
  details: VoucherDetail[];
  initialAccounts: Account[];
  updateDetail: (index: number, newValues: Partial<VoucherDetail>) => void;
}

const AdjustmentTable = ({
  isEditing,
  addDetailRow,
  textAlign,
  isVoucherBalanced = false,
  details,
  initialAccounts,
  updateDetail,
}: AdjustmentTableProps) => {
  const t = useTranslations("forms.adjustment");
  const textAlignCenter = "text-center";

  return (
    <div className="bg-white rounded-lg border border-slate-200 mb-1.5 p-0.5">
      <div className="flex justify-between items-center mb-0.5">
        <button
          className={`text-xs px-2 py-0.5 btn ${textAlign}`}
          disabled={!isEditing}
          type="button"
          onClick={addDetailRow}
        >
          {t("actions.addRow")}
        </button>
        <span
          className={`text-[10px] px-1.5 py-0.5 rounded-full font-medium flex items-center gap-0.5 ${
            isVoucherBalanced
              ? "bg-emerald-200 text-emerald-900"
              : "bg-red-200 text-red-900"
          }`}
        >
          {isVoucherBalanced ? (
            <CheckCircleIcon className="w-3 h-3" />
          ) : (
            <ExclamationTriangleIcon className="w-3 h-3" />
          )}
          {isVoucherBalanced ? t("status.balanced") : t("status.unbalanced")}
        </span>
      </div>
      <div className="overflow-x-auto mb-0.5 max-w-full">
        <div className="max-h-[500px] overflow-y-auto">
          <table className="min-w-[1350px] border text-xs text-center table-fixed">
            <thead className="bg-gray-100 text-[10px] font-bold">
              <tr>
                {adjustmentTableColumns.map((col) => (
                  <th
                    key={col.key}
                    className={`px-0.5 py-0.5 font-bold text-slate-700 border leading-tight ${textAlignCenter}`}
                    colSpan={col.colSpan}
                    rowSpan={col.rowSpan}
                    style={{ width: col.width }}
                  >
                    {t(`table.columns.${col.label}`)}
                  </th>
                ))}
              </tr>
              <tr>
                {adjustmentTableColumns.flatMap((col) =>
                  "subColumns" in col
                    ? col.subColumns.map((subCol) => (
                        <th
                          key={subCol.key}
                          className={`px-0.5 py-0.5 font-bold text-slate-700 border leading-tight ${textAlignCenter}`}
                        >
                          {t(`table.columns.${subCol.label}`)}
                        </th>
                      ))
                    : [],
                )}
              </tr>
            </thead>
            <tbody>
              {details.map((detail, index) => (
                <AdjustmentColumn
                  key={detail.id}
                  detail={detail}
                  isEditing={isEditing}
                  initialAccounts={initialAccounts}
                  updateDetail={updateDetail}
                  index={index}
                />
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default AdjustmentTable;
