import { memo, type ReactNode } from "react";
import { useTranslations } from "next-intl";

import {
  BALANCE_TABLE_FIRST_ROW_COLUMNS,
  BALANCE_TABLE_SECOND_ROW_COLUMNS,
  BALANCE_TABLE_TH_BASE_CLASS,
} from "../constants";

interface DetailsTableProps {
  isEditing: boolean;
  addDetailRow: () => void;
  isBalanced: boolean;
  costCenters: any[];
  children: ReactNode;
}

const DetailsTable = memo(
  ({
    isEditing,
    addDetailRow,
    isBalanced,
    costCenters,
    children,
  }: DetailsTableProps) => {
    const t = useTranslations("forms.balanceVoucher");

    return (
      <div className="bg-white rounded-lg border border-slate-200 mb-1.5 p-0.5">
        <div className="flex justify-between items-center mb-0.5">
          <button
            className={`text-xs px-2 py-0.5 btn `}
            data-skip-key-as-tab="true"
            disabled={!isEditing}
            tabIndex={-1}
            type="button"
            onClick={addDetailRow}
          >
            {t("actions.addRow")}
          </button>
          <span
            className={`text-[10px] px-1.5 py-0.5 rounded-full font-medium ${
              isBalanced
                ? "bg-emerald-200 text-emerald-900"
                : "bg-red-200 text-red-900"
            }`}
          >
            <i
              className={`bi ${isBalanced ? "bi-check-circle" : "bi-exclamation-triangle"} me-0.5`}
            />
            {isBalanced ? t("status.balanced") : t("status.unbalanced")}
          </span>
        </div>
        <div className="overflow-x-auto mb-0.5 max-w-full max-h-[500px] overflow-y-auto">
          <table className="w-full border text-xs text-center table-fixed">
            <thead className="sticky top-0 z-10 bg-gray-100 text-xs font-bold">
              <tr>
                {BALANCE_TABLE_FIRST_ROW_COLUMNS.map((col) => {
                  if (col.conditionalOnCostCenters && costCenters.length === 0)
                    return null;

                  return (
                    <th
                      key={col.translationKey}
                      className={`${col.width} ${BALANCE_TABLE_TH_BASE_CLASS}`}
                      rowSpan={col.rowSpan}
                      colSpan={col.colSpan}
                    >
                      {t(col.translationKey as Parameters<typeof t>[0])}
                    </th>
                  );
                })}
              </tr>
              <tr>
                {BALANCE_TABLE_SECOND_ROW_COLUMNS.map((col) => (
                  <th
                    key={col.translationKey}
                    className={`${col.width} ${BALANCE_TABLE_TH_BASE_CLASS}`}
                  >
                    {t(col.translationKey as Parameters<typeof t>[0])}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>{children}</tbody>
          </table>
        </div>
      </div>
    );
  },
);

DetailsTable.displayName = "DetailsTable";

export default DetailsTable;
