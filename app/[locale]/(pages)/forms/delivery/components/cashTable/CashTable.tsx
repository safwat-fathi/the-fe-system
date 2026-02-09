import type { VoucherBox } from "@/types/voucher";

import { useLocale, useTranslations } from "next-intl";
import { memo, useCallback, type KeyboardEvent } from "react";

import { CASH_TABLE_COLUMNS } from "../../constants";

import CashRowTable from "./CashRowTable";

import { getLocaleDir } from "@/i18n/config";

type BoxOption = {
  value: number;
  label: string;
};

type SelectOption = {
  value: string;
  label: string;
};

interface CashTableProps {
  isEditing: boolean;
  addVoucherBoxRow: () => void;
  voucherBoxes: VoucherBox[];
  cashBoxSelectOptions: BoxOption[];
  costCenterOptions: SelectOption[];
  setBoxInputRef: (
    index: number,
    col: number,
  ) => (input: HTMLInputElement | null) => void;
  updateVoucherBox: (
    index: number,
    field: keyof VoucherBox,
    value: unknown,
  ) => void;
  handleBoxKeyDown: (e: KeyboardEvent, index: number, col: number) => void;
  focusNextBoxField: (index: number, col: number) => void;
  onRemoveRow: (index: number) => void;
}

const CashTable = ({
  isEditing,
  addVoucherBoxRow,
  voucherBoxes,
  cashBoxSelectOptions,
  costCenterOptions,
  setBoxInputRef,
  updateVoucherBox,
  handleBoxKeyDown,
  focusNextBoxField,
  onRemoveRow,
}: CashTableProps) => {
  const t = useTranslations("forms.customerGoldVoucher.tables.cash");
  const locale = useLocale();
  const dir = getLocaleDir(locale as "ar" | "en");
  const textAlign = dir === "rtl" ? "text-right" : "text-left";

  const getBoxValue = useCallback(
    (boxId: number | undefined): BoxOption | null => {
      if (!boxId) return null;

      return cashBoxSelectOptions.find((opt) => opt.value === boxId) || null;
    },
    [cashBoxSelectOptions],
  );

  const getCostCenterValue = useCallback(
    (costId: number | null | undefined): SelectOption | null => {
      if (!costId) return null;

      return (
        costCenterOptions.find((opt) => opt.value === String(costId)) || null
      );
    },
    [costCenterOptions],
  );

  return (
    <div className="bg-white rounded-lg border border-slate-200 mb-1.5">
      <div className="p-1 border-b border-slate-200 bg-slate-50">
        <h3 className={`text-xs font-semibold text-slate-800 ${textAlign}`}>
          {t("title")}
        </h3>
      </div>
      <div className="p-0.5">
        <div className="flex justify-between mb-0.5">
          <button
            className="text-xs px-2 py-0.5 btn"
            disabled={!isEditing}
            type="button"
            onClick={addVoucherBoxRow}
          >
            {t("addRow")}
          </button>
        </div>
        <div className="overflow-x-auto mb-0.5 max-w-full">
          <table className="w-full border text-xs text-center">
            <thead className="bg-gray-100 text-xs font-bold">
              <tr>
                {CASH_TABLE_COLUMNS.map((column) => (
                  <th key={column.key} className={`p-1 border ${column.width}`}>
                    {t(`columns.${column.key}` as Parameters<typeof t>[0])}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {voucherBoxes.map((voucherBox, rowIndex) => (
                <CashRowTable
                  key={voucherBox.id || rowIndex}
                  index={rowIndex}
                  isEditing={isEditing}
                  box={voucherBox}
                  cashBoxSelectOptions={cashBoxSelectOptions}
                  boxValue={getBoxValue(voucherBox.box_id)}
                  costCenterOptions={costCenterOptions}
                  costCenterValue={getCostCenterValue(voucherBox.cost_id)}
                  setBoxInputRef={setBoxInputRef}
                  updateVoucherBox={updateVoucherBox}
                  handleBoxKeyDown={handleBoxKeyDown}
                  focusNextBoxField={focusNextBoxField}
                  onRemoveRow={onRemoveRow}
                />
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default memo(CashTable);
